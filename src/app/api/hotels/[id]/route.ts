import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { getSiteOrigin } from "@/lib/banner-meta";
import { buildHotelSeo } from "@/lib/hotel-meta";
import { removeHotelById, saveHotelById } from "@/lib/hotel-store";
import type { EntityStatus } from "@/types/airline";

function normalizeAmenities(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
    const body = (await request.json()) as {
      name?: string;
      location?: string;
      stars?: number | string;
      rating?: string;
      reviews?: string;
      amenities?: string[] | string;
      description?: string;
      image_url?: string;
      status?: EntityStatus;
    };

    const name = String(body.name || "").trim();
    const location = String(body.location || "").trim();
    const stars = Number(body.stars || 0);

    if (!name || !location) {
      return NextResponse.json({ error: "Hotel name and location are required." }, { status: 400 });
    }

    const seo = buildHotelSeo(name, location, stars, getSiteOrigin(new URL(request.url).origin));
    const patch = {
      name,
      location,
      stars: Number.isFinite(stars) ? stars : 0,
      rating: String(body.rating || "").trim() || null,
      reviews: String(body.reviews || "").trim() || null,
      amenities: normalizeAmenities(body.amenities),
      description: String(body.description || "").trim() || null,
      image_url: String(body.image_url || "").trim() || null,
      slug: seo.slug,
      seo_title: seo.seo_title,
      meta_description: seo.meta_description,
      h1_heading: seo.h1_heading,
      page_url: seo.page_url,
      og_title: seo.og_title,
      og_description: seo.og_description,
      seo_keywords: seo.seo_keywords,
      ...(body.status ? { status: body.status } : {}),
    };

    const hotel = await saveHotelById(id, patch);
    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found." }, { status: 404 });
    }

    return NextResponse.json({ hotel });
  } catch (error) {
    console.error("hotel PATCH error:", error);
    return NextResponse.json({ error: "Unable to update hotel." }, { status: 500 });
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
    const hotel = await removeHotelById(id);
    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("hotel DELETE error:", error);
    return NextResponse.json({ error: "Unable to delete hotel." }, { status: 500 });
  }
}
