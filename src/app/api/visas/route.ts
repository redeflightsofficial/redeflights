import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { getSiteOrigin } from "@/lib/banner-meta";
import { formatStorageError, mergeWithLocalById, useLocalStorage } from "@/lib/storage-mode";
import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import { withQueryTimeout } from "@/lib/supabase-query";
import { buildVisaSeo } from "@/lib/visa-meta";
import { processVisaImageUpload } from "@/lib/visa-upload";
import { findLocalVisaBySlug, insertLocalVisa, readLocalVisas } from "@/lib/visa-local";
import { saveVisaById } from "@/lib/visa-store";
import type { EntityStatus } from "@/types/airline";
import type { Visa } from "@/types/visa";

async function parseVisaRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return {
      country: String(formData.get("country") || "").trim(),
      visa_type: String(formData.get("visa_type") || "").trim(),
      processing_time: String(formData.get("processing_time") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      image_url: String(formData.get("image_url") || "").trim(),
      status: String(formData.get("status") || "").trim() as EntityStatus | "",
      file: formData.get("file"),
    };
  }

  const body = (await request.json()) as {
    country?: string;
    visa_type?: string;
    processing_time?: string;
    description?: string;
    image_url?: string;
    status?: EntityStatus;
  };

  return {
    country: String(body.country || "").trim(),
    visa_type: String(body.visa_type || "").trim(),
    processing_time: String(body.processing_time || "").trim(),
    description: String(body.description || "").trim(),
    image_url: String(body.image_url || "").trim(),
    status: body.status || ("" as const),
    file: null,
  };
}

async function loadVisas(activeOnly: boolean, siteOrigin = getSiteOrigin()) {
  let visas: Visa[] = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      let query = supabase.from("visas").select("*").order("created_at", { ascending: false });
      if (activeOnly) query = query.eq("status", "active");

      const { data, error } = await withQueryTimeout(query, 5000, "visas fetch");
      visas = (data ?? []) as Visa[];

      if (error) {
        console.error("visas fetch error:", error);
        visas = [];
      }
    } catch (error) {
      console.error("visas fetch error:", error);
      visas = [];
    }
  }

  const localVisas = await readLocalVisas();
  const filteredLocal = activeOnly
    ? localVisas.filter((item) => item.status === "active")
    : localVisas;

  visas = mergeWithLocalById(visas, filteredLocal);

  visas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return visas.map((item) => {
    const seo = buildVisaSeo(item.country, item.visa_type || "", item.processing_time || "", siteOrigin);
    return { ...item, page_url: item.page_url || seo.page_url };
  });
}

function buildStats(visas: Visa[]) {
  return {
    total: visas.length,
    pending: visas.filter((item) => item.status === "pending").length,
    active: visas.filter((item) => item.status === "active").length,
  };
}

export async function GET(request: Request) {
  try {
    let session = null;
    try {
      session = getAdminSessionFromRequest(request);
    } catch (error) {
      console.error("visas session parse error:", error);
    }

    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const visas = await loadVisas(!session, siteOrigin);

    if (session) {
      return NextResponse.json({ visas, stats: buildStats(visas) });
    }

    return NextResponse.json({ visas });
  } catch (error) {
    console.error("visas GET error:", error);
    return NextResponse.json({ visas: [] });
  }
}

export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const input = await parseVisaRequest(request);
    const country = input.country;
    const visaType = input.visa_type;

    if (!country) {
      return NextResponse.json({ error: "Country is required." }, { status: 400 });
    }

    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const processingTime = input.processing_time;
    const seo = buildVisaSeo(country, visaType, processingTime, siteOrigin);

    let imageMeta: { image_url: string | null; storage_path: string | null };
    try {
      const existingPaths = (await readLocalVisas())
        .map((item) => item.storage_path || "")
        .filter(Boolean);
      imageMeta = await processVisaImageUpload(input.file, input.image_url, siteOrigin, {
        country,
        existingPaths,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_TYPE") {
        return NextResponse.json(
          { error: "Only PNG, JPG, or WEBP images are allowed." },
          { status: 400 },
        );
      }
      if (error instanceof Error && error.message === "TOO_LARGE") {
        return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
      }
      throw error;
    }

    const payload = {
      country,
      visa_type: visaType || null,
      processing_time: processingTime || null,
      description: input.description || null,
      image_url: imageMeta.image_url,
      storage_path: imageMeta.storage_path,
      slug: seo.slug,
      seo_title: seo.seo_title,
      meta_description: seo.meta_description,
      h1_heading: seo.h1_heading,
      page_url: seo.page_url,
      og_title: seo.og_title,
      og_description: seo.og_description,
      seo_keywords: seo.seo_keywords,
      status: (input.status === "pending" ? "pending" : "active") as EntityStatus,
    };

    let storageError: unknown = null;

    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from("visas").insert(payload).select("*").single();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          message: "Visa service added with auto SEO.",
          visa: data,
        });
      }

      storageError = error;
      console.error("visa insert error:", error);
    }

    if (useLocalStorage()) {
      const existing = await findLocalVisaBySlug(seo.slug);
      if (existing) {
        return NextResponse.json({ error: "This visa service already exists." }, { status: 409 });
      }

      const localVisa = await insertLocalVisa(payload);
      return NextResponse.json({
        success: true,
        message: "Visa service saved with auto SEO.",
        visa: localVisa,
      });
    }

    return NextResponse.json({ error: formatStorageError(storageError) }, { status: 500 });
  } catch (error) {
    console.error("visas POST error:", error);
    return NextResponse.json({ error: "Unable to add visa service." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { id?: string; status?: EntityStatus };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "Visa id and status are required." }, { status: 400 });
    }

    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("visas")
        .update({ status: body.status })
        .eq("id", body.id)
        .select("*")
        .single();

      if (!error && data) {
        return NextResponse.json({ visa: data });
      }

      if (useLocalStorage()) {
        const localVisa = await saveVisaById(body.id, { status: body.status });
        if (!localVisa) {
          return NextResponse.json({ error: "Visa not found." }, { status: 404 });
        }

        return NextResponse.json({ visa: localVisa });
      }

      console.error("visa status update error:", error);
      return NextResponse.json({ error: formatStorageError(error) }, { status: 500 });
    }

    const localVisa = await saveVisaById(body.id, { status: body.status });
    if (!localVisa) {
      return NextResponse.json({ error: "Visa not found." }, { status: 404 });
    }

    return NextResponse.json({ visa: localVisa });
  } catch (error) {
    console.error("visas PATCH error:", error);
    return NextResponse.json({ error: "Unable to update visa." }, { status: 500 });
  }
}
