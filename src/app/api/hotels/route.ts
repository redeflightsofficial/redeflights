import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { getSiteOrigin } from "@/lib/banner-meta";
import { findLocalHotelBySlug, insertLocalHotel, readLocalHotels } from "@/lib/hotel-local";
import { buildHotelSeo } from "@/lib/hotel-meta";
import { saveHotelById } from "@/lib/hotel-store";
import { formatStorageError, mergeWithLocalById, useLocalStorage } from "@/lib/storage-mode";
import { createAdminClient, hasSupabaseConfig, logSupabaseError } from "@/lib/supabase-admin";
import { withQueryTimeout } from "@/lib/supabase-query";
import type { EntityStatus } from "@/types/airline";
import type { Hotel } from "@/types/hotel";

function normalizeAmenities(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function loadHotels(activeOnly: boolean, siteOrigin = getSiteOrigin()) {
  let hotels: Hotel[] = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      let query = supabase.from("hotels").select("*").order("created_at", { ascending: false });
      if (activeOnly) query = query.eq("status", "active");

      const { data, error } = await withQueryTimeout(query, 5000, "hotels fetch");
      hotels = (data ?? []) as Hotel[];

      if (error) {
        logSupabaseError("hotels fetch error:", error);
        hotels = [];
      }
    } catch (error) {
      logSupabaseError("hotels fetch error:", error);
      hotels = [];
    }
  }

  const localHotels = await readLocalHotels();
  const filteredLocal = activeOnly
    ? localHotels.filter((item) => item.status === "active")
    : localHotels;

  hotels = mergeWithLocalById(hotels, filteredLocal);

  hotels.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return hotels.map((item) => {
    const seo = buildHotelSeo(item.name, item.location, item.stars, siteOrigin);
    return { ...item, page_url: item.page_url || seo.page_url };
  });
}

function buildStats(hotels: Hotel[]) {
  return {
    total: hotels.length,
    pending: hotels.filter((item) => item.status === "pending").length,
    active: hotels.filter((item) => item.status === "active").length,
  };
}

export async function GET(request: Request) {
  try {
    let session = null;
    try {
      session = getAdminSessionFromRequest(request);
    } catch (error) {
      console.error("hotels session parse error:", error);
    }

    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const hotels = await loadHotels(!session, siteOrigin);

    if (session) {
      return NextResponse.json({ hotels, stats: buildStats(hotels) });
    }

    return NextResponse.json({ hotels });
  } catch (error) {
    console.error("hotels GET error:", error);
    return NextResponse.json({ hotels: [] });
  }
}

export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
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

    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const seo = buildHotelSeo(name, location, stars, siteOrigin);
    const payload = {
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
      status: (body.status === "pending" ? "pending" : "active") as EntityStatus,
    };

    let storageError: unknown = null;

    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from("hotels").insert(payload).select("*").single();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          message: "Hotel added with auto SEO.",
          hotel: data,
        });
      }

      storageError = error;
      console.error("hotel insert error:", error);
    }

    if (useLocalStorage()) {
      const existing = await findLocalHotelBySlug(seo.slug);
      if (existing) {
        return NextResponse.json({ error: "This hotel already exists." }, { status: 409 });
      }

      const localHotel = await insertLocalHotel(payload);
      return NextResponse.json({
        success: true,
        message: "Hotel saved with auto SEO.",
        hotel: localHotel,
      });
    }

    return NextResponse.json({ error: formatStorageError(storageError) }, { status: 500 });
  } catch (error) {
    console.error("hotels POST error:", error);
    return NextResponse.json({ error: "Unable to add hotel." }, { status: 500 });
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
      return NextResponse.json({ error: "Hotel id and status are required." }, { status: 400 });
    }

    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("hotels")
        .update({ status: body.status })
        .eq("id", body.id)
        .select("*")
        .single();

      if (!error && data) {
        return NextResponse.json({ hotel: data });
      }

      if (useLocalStorage()) {
        const localHotel = await saveHotelById(body.id, { status: body.status });
        if (!localHotel) {
          return NextResponse.json({ error: "Hotel not found." }, { status: 404 });
        }

        return NextResponse.json({ hotel: localHotel });
      }

      console.error("hotel status update error:", error);
      return NextResponse.json({ error: formatStorageError(error) }, { status: 500 });
    }

    const localHotel = await saveHotelById(body.id, { status: body.status });
    if (!localHotel) {
      return NextResponse.json({ error: "Hotel not found." }, { status: 404 });
    }

    return NextResponse.json({ hotel: localHotel });
  } catch (error) {
    console.error("hotels PATCH error:", error);
    return NextResponse.json({ error: "Unable to update hotel." }, { status: 500 });
  }
}
