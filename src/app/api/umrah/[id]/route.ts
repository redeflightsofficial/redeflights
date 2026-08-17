import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { getSiteOrigin } from "@/lib/banner-meta";
import { buildUmrahSeo, parseUmrahFaqs, parseYesNo } from "@/lib/umrah-meta";
import { getUmrahById, removeUmrahById, saveUmrahById } from "@/lib/umrah-store";
import type { EntityStatus } from "@/types/airline";

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
    const existing = await getUmrahById(id);
    if (!existing) {
      return NextResponse.json({ error: "Umrah package not found." }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const title = String(body.title ?? existing.title).trim();
    if (!title) {
      return NextResponse.json({ error: "Package name is required." }, { status: 400 });
    }

    const departureCity = String(body.departure_city ?? existing.departure_city).trim();
    const nights = Number(body.nights ?? existing.nights);
    const focusKeyword = String(body.focus_keyword ?? existing.focus_keyword).trim();
    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const seo = buildUmrahSeo(title, departureCity, nights, focusKeyword, siteOrigin);
    const slug = String(body.slug ?? existing.slug).trim() || seo.slug;

    const patch = {
      package_code: String(body.package_code ?? existing.package_code).trim(),
      title,
      departure_city: departureCity || "Dubai",
      destination: String(body.destination ?? existing.destination).trim() || "Makkah & Madinah",
      hotel_category: String(body.hotel_category ?? existing.hotel_category).trim(),
      hotel_name: String(body.hotel_name ?? existing.hotel_name).trim(),
      nights: Number.isFinite(nights) ? nights : existing.nights,
      airline: String(body.airline ?? existing.airline).trim() || "Any",
      price_aed: String(body.price_aed ?? existing.price_aed).trim(),
      visa_included:
        body.visa_included === undefined
          ? existing.visa_included
          : parseYesNo(body.visa_included, existing.visa_included),
      transfer_included:
        body.transfer_included === undefined
          ? existing.transfer_included
          : parseYesNo(body.transfer_included, existing.transfer_included),
      focus_keyword: focusKeyword,
      short_description: String(body.short_description ?? existing.short_description).trim(),
      long_description: String(body.long_description ?? existing.long_description).trim(),
      h2_heading: String(body.h2_heading ?? existing.h2_heading).trim(),
      image_url:
        body.image_url === undefined
          ? existing.image_url
          : String(body.image_url || "").trim() || null,
      image_alt: String(body.image_alt ?? existing.image_alt).trim(),
      faqs: body.faqs === undefined ? existing.faqs : parseUmrahFaqs(body.faqs),
      schema_description: String(body.schema_description ?? existing.schema_description).trim(),
      instagram_caption: String(body.instagram_caption ?? existing.instagram_caption).trim(),
      instagram_hashtags: String(body.instagram_hashtags ?? existing.instagram_hashtags).trim(),
      internal_links: String(body.internal_links ?? existing.internal_links).trim(),
      slug,
      seo_title: String(body.seo_title ?? existing.seo_title).trim() || seo.seo_title,
      meta_description:
        String(body.meta_description ?? existing.meta_description).trim() || seo.meta_description,
      h1_heading: String(body.h1_heading ?? existing.h1_heading).trim() || seo.h1_heading,
      page_url: seo.page_url,
      og_title: String(body.og_title ?? existing.og_title).trim() || seo.og_title,
      og_description:
        String(body.og_description ?? existing.og_description).trim() || seo.og_description,
      seo_keywords: String(body.seo_keywords ?? existing.seo_keywords).trim() || seo.seo_keywords,
      ...(body.status
        ? { status: String(body.status).trim() as EntityStatus }
        : {}),
    };

    const pkg = await saveUmrahById(id, patch);
    if (!pkg) {
      return NextResponse.json({ error: "Umrah package not found." }, { status: 404 });
    }

    return NextResponse.json({ package: pkg });
  } catch (error) {
    console.error("umrah PATCH error:", error);
    return NextResponse.json({ error: "Unable to update Umrah package." }, { status: 500 });
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
    const pkg = await removeUmrahById(id);
    if (!pkg) {
      return NextResponse.json({ error: "Umrah package not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("umrah DELETE error:", error);
    return NextResponse.json({ error: "Unable to delete Umrah package." }, { status: 500 });
  }
}
