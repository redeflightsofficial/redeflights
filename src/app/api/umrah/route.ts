import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { getSiteOrigin } from "@/lib/banner-meta";
import { formatStorageError, useLocalStorage } from "@/lib/storage-mode";
import { createAdminClient, hasSupabaseConfig, isIgnorableSupabaseError, logSupabaseError } from "@/lib/supabase-admin";
import { withQueryTimeout } from "@/lib/supabase-query";
import {
  buildUmrahSeo,
  parseUmrahFaqs,
  parseYesNo,
} from "@/lib/umrah-meta";
import {
  findLocalUmrahBySlug,
  insertLocalUmrahPackage,
  readLocalUmrahPackages,
} from "@/lib/umrah-local";
import { saveUmrahById } from "@/lib/umrah-store";
import type { EntityStatus } from "@/types/airline";
import type { UmrahPackage } from "@/types/umrah";

async function parseUmrahRequest(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;

  return {
    package_code: String(body.package_code || "").trim(),
    title: String(body.title || "").trim(),
    departure_city: String(body.departure_city || "").trim(),
    destination: String(body.destination || "").trim(),
    hotel_category: String(body.hotel_category || "").trim(),
    hotel_name: String(body.hotel_name || "").trim(),
    nights: Number(body.nights || 0),
    airline: String(body.airline || "").trim(),
    price_aed: String(body.price_aed || "").trim(),
    visa_included: parseYesNo(body.visa_included),
    transfer_included: parseYesNo(body.transfer_included),
    focus_keyword: String(body.focus_keyword || "").trim(),
    short_description: String(body.short_description || "").trim(),
    long_description: String(body.long_description || "").trim(),
    h2_heading: String(body.h2_heading || "").trim(),
    image_url: String(body.image_url || "").trim(),
    image_alt: String(body.image_alt || "").trim(),
    faqs: parseUmrahFaqs(body.faqs),
    schema_description: String(body.schema_description || "").trim(),
    instagram_caption: String(body.instagram_caption || "").trim(),
    instagram_hashtags: String(body.instagram_hashtags || "").trim(),
    internal_links: String(body.internal_links || "").trim(),
    slug: String(body.slug || "").trim(),
    seo_title: String(body.seo_title || "").trim(),
    meta_description: String(body.meta_description || "").trim(),
    h1_heading: String(body.h1_heading || "").trim(),
    og_title: String(body.og_title || "").trim(),
    og_description: String(body.og_description || "").trim(),
    seo_keywords: String(body.seo_keywords || "").trim(),
    status: String(body.status || "").trim() as EntityStatus | "",
  };
}

async function loadUmrahPackages(activeOnly: boolean, siteOrigin = getSiteOrigin()) {
  let packages: UmrahPackage[] = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      let query = supabase
        .from("umrah_packages")
        .select("*")
        .order("created_at", { ascending: false });
      if (activeOnly) query = query.eq("status", "active");

      const { data, error } = await withQueryTimeout(query, 5000, "umrah fetch");
      packages = (data ?? []) as UmrahPackage[];

      if (error) {
        logSupabaseError("umrah fetch error:", error);
        packages = [];
      }
    } catch (error) {
      logSupabaseError("umrah fetch error:", error);
      packages = [];
    }
  }

  // Always merge local Umrah packages so seeded data works before SQL is applied.
  const localPackages = await readLocalUmrahPackages();
  const filteredLocal = activeOnly
    ? localPackages.filter((item) => item.status === "active")
    : localPackages;
  const seen = new Set(packages.map((item) => item.id));
  for (const item of filteredLocal) {
    if (!seen.has(item.id)) packages.push(item);
  }

  packages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return packages.map((item) => {
    const seo = buildUmrahSeo(
      item.title,
      item.departure_city,
      item.nights,
      item.focus_keyword,
      siteOrigin,
    );
    return { ...item, page_url: item.page_url || seo.page_url };
  });
}

function buildStats(packages: UmrahPackage[]) {
  return {
    total: packages.length,
    pending: packages.filter((item) => item.status === "pending").length,
    active: packages.filter((item) => item.status === "active").length,
  };
}

export async function GET(request: Request) {
  try {
    let session = null;
    try {
      session = getAdminSessionFromRequest(request);
    } catch (error) {
      console.error("umrah session parse error:", error);
    }

    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const packages = await loadUmrahPackages(!session, siteOrigin);

    if (session) {
      return NextResponse.json({ packages, stats: buildStats(packages) });
    }

    return NextResponse.json({ packages });
  } catch (error) {
    console.error("umrah GET error:", error);
    return NextResponse.json({ packages: [] });
  }
}

export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const input = await parseUmrahRequest(request);
    if (!input.title) {
      return NextResponse.json({ error: "Package name is required." }, { status: 400 });
    }

    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const seo = buildUmrahSeo(
      input.title,
      input.departure_city,
      input.nights,
      input.focus_keyword,
      siteOrigin,
    );
    const slug = input.slug || seo.slug;

    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      const { data: existingSlug } = await supabase
        .from("umrah_packages")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (existingSlug) {
        return NextResponse.json({ error: "This Umrah package already exists." }, { status: 409 });
      }
    } else {
      const existing = await findLocalUmrahBySlug(slug);
      if (existing) {
        return NextResponse.json({ error: "This Umrah package already exists." }, { status: 409 });
      }
    }

    const payload = {
      package_code: input.package_code,
      title: input.title,
      departure_city: input.departure_city || "Dubai",
      destination: input.destination || "Makkah & Madinah",
      hotel_category: input.hotel_category,
      hotel_name: input.hotel_name,
      nights: Number.isFinite(input.nights) ? input.nights : 0,
      airline: input.airline || "Any",
      price_aed: input.price_aed,
      visa_included: input.visa_included,
      transfer_included: input.transfer_included,
      focus_keyword: input.focus_keyword || seo.seo_keywords.split(",")[0]?.trim() || "",
      short_description: input.short_description,
      long_description: input.long_description,
      h2_heading: input.h2_heading,
      image_url: input.image_url || null,
      image_alt: input.image_alt,
      faqs: input.faqs,
      schema_description: input.schema_description,
      instagram_caption: input.instagram_caption,
      instagram_hashtags: input.instagram_hashtags,
      internal_links: input.internal_links,
      slug,
      seo_title: input.seo_title || seo.seo_title,
      meta_description: input.meta_description || seo.meta_description,
      h1_heading: input.h1_heading || seo.h1_heading,
      page_url: seo.page_url,
      og_title: input.og_title || seo.og_title,
      og_description: input.og_description || seo.og_description,
      seo_keywords: input.seo_keywords || seo.seo_keywords,
      status: (input.status === "pending" ? "pending" : "active") as EntityStatus,
    };

    let storageError: unknown = null;

    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from("umrah_packages").insert(payload).select("*").single();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          message: "Umrah package added with SEO.",
          package: data,
        });
      }

      storageError = error;
      console.error("umrah insert error:", error);

      if (isIgnorableSupabaseError(error)) {
        const localPackage = await insertLocalUmrahPackage(payload);
        return NextResponse.json({
          success: true,
          message: "Umrah package saved locally. Run supabase/umrah.sql in Supabase for cloud sync.",
          package: localPackage,
        });
      }
    }

    if (useLocalStorage() || storageError) {
      const existing = await findLocalUmrahBySlug(slug);
      if (existing) {
        return NextResponse.json({ error: "This Umrah package already exists." }, { status: 409 });
      }

      const localPackage = await insertLocalUmrahPackage(payload);
      return NextResponse.json({
        success: true,
        message: "Umrah package saved with SEO.",
        package: localPackage,
      });
    }

    return NextResponse.json({ error: formatStorageError(storageError) }, { status: 500 });
  } catch (error) {
    console.error("umrah POST error:", error);
    return NextResponse.json({ error: "Unable to add Umrah package." }, { status: 500 });
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
      return NextResponse.json({ error: "Package id and status are required." }, { status: 400 });
    }

    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("umrah_packages")
        .update({ status: body.status })
        .eq("id", body.id)
        .select("*")
        .single();

      if (!error && data) {
        return NextResponse.json({ package: data });
      }

      if (useLocalStorage()) {
        const localPackage = await saveUmrahById(body.id, { status: body.status });
        if (!localPackage) {
          return NextResponse.json({ error: "Umrah package not found." }, { status: 404 });
        }
        return NextResponse.json({ package: localPackage });
      }

      console.error("umrah status update error:", error);
      return NextResponse.json({ error: formatStorageError(error) }, { status: 500 });
    }

    const localPackage = await saveUmrahById(body.id, { status: body.status });
    if (!localPackage) {
      return NextResponse.json({ error: "Umrah package not found." }, { status: 404 });
    }

    return NextResponse.json({ package: localPackage });
  } catch (error) {
    console.error("umrah PATCH error:", error);
    return NextResponse.json({ error: "Unable to update Umrah package." }, { status: 500 });
  }
}
