import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { getSiteOrigin } from "@/lib/banner-meta";
import { buildVisaSeo } from "@/lib/visa-meta";
import { readLocalVisas } from "@/lib/visa-local";
import { processVisaImageUpload, removeVisaImageFile } from "@/lib/visa-upload";
import { getVisaById, removeVisaById, saveVisaById } from "@/lib/visa-store";
import type { EntityStatus } from "@/types/airline";

async function parseVisaPatchRequest(request: Request) {
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await getVisaById(id);
    if (!existing) {
      return NextResponse.json({ error: "Visa not found." }, { status: 404 });
    }

    const input = await parseVisaPatchRequest(request);
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
        existingStoragePath: existing.storage_path,
        existingImageUrl: existing.image_url,
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

    const patch = {
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
      ...(input.status ? { status: input.status } : {}),
    };

    const visa = await saveVisaById(id, patch);
    if (!visa) {
      return NextResponse.json({ error: "Visa not found." }, { status: 404 });
    }

    return NextResponse.json({ visa });
  } catch (error) {
    console.error("visa PATCH error:", error);
    return NextResponse.json({ error: "Unable to update visa." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const visa = await removeVisaById(id);
    if (!visa) {
      return NextResponse.json({ error: "Visa not found." }, { status: 404 });
    }

    if (visa.storage_path || visa.image_url) {
      await removeVisaImageFile(visa.storage_path || "", visa.image_url || "");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("visa DELETE error:", error);
    return NextResponse.json({ error: "Unable to delete visa." }, { status: 500 });
  }
}
