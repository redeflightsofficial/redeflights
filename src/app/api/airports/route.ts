import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { buildAirportSeo } from "@/lib/airport-meta";
import {
  clearAllLocalAirports,
  findLocalAirportByIata,
  insertLocalAirport,
  readDeletedAirportCodes,
  readLocalAirports,
  updateLocalAirportStatus,
} from "@/lib/airport-local";
import { clearSupabaseTable, safeLocalClear } from "@/lib/bulk-delete";
import { getSiteOrigin } from "@/lib/banner-meta";
import { formatStorageError, mergeWithLocalByCode, useLocalStorage } from "@/lib/storage-mode";
import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import type { EntityStatus } from "@/types/airline";
import type { Airport } from "@/types/airport";

async function loadAirports(activeOnly: boolean, siteOrigin = getSiteOrigin()) {
  const supabase = createAdminClient();
  let query = supabase.from("airports").select("*").order("created_at", { ascending: false });
  if (activeOnly) query = query.eq("status", "active");

  const { data, error } = await query;
  let airports = (data ?? []) as Airport[];

  if (error) {
    console.error("airports fetch error:", error);
    airports = [];
  }

  const localAirports = await readLocalAirports();
  const filteredLocal = activeOnly
    ? localAirports.filter((item) => item.status === "active")
    : localAirports;

  airports = mergeWithLocalByCode(airports, filteredLocal);

  airports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const deletedCodes = new Set((await readDeletedAirportCodes()).map((code) => code.toUpperCase()));
  airports = airports.filter((item) => !deletedCodes.has(item.iata_code.toUpperCase()));

  return airports.map((item) => {
    const seo = buildAirportSeo(item.name, item.iata_code, item.city, item.country || "", siteOrigin);
    return {
      ...item,
      page_url: item.page_url || seo.page_url,
    };
  });
}

function buildStats(airports: Airport[]) {
  return {
    total: airports.length,
    pending: airports.filter((item) => item.status === "pending").length,
    active: airports.filter((item) => item.status === "active").length,
  };
}

export async function GET(request: Request) {
  try {
    const session = getAdminSessionFromRequest(request);
    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const airports = await loadAirports(!session, siteOrigin);

    if (session) {
      return NextResponse.json({ airports, stats: buildStats(airports) });
    }

    return NextResponse.json({ airports });
  } catch (error) {
    console.error("airports GET error:", error);
    return NextResponse.json({ error: "Unable to load airports." }, { status: 500 });
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
      iata_code?: string;
      city?: string;
      country?: string;
      status?: EntityStatus;
    };

    const name = String(body.name || "").trim();
    const iataCode = String(body.iata_code || "").trim().toUpperCase();
    const city = String(body.city || "").trim();

    if (!name || !iataCode || !city) {
      return NextResponse.json(
        { error: "Airport name, IATA code, and city are required." },
        { status: 400 },
      );
    }

    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const seo = buildAirportSeo(name, iataCode, city, String(body.country || "").trim(), siteOrigin);

    const payload = {
      name,
      iata_code: iataCode,
      city,
      country: String(body.country || "").trim() || null,
      slug: seo.slug,
      seo_title: seo.seo_title,
      meta_description: seo.meta_description,
      h1_heading: seo.h1_heading,
      page_url: seo.page_url,
      status: (body.status === "pending" ? "pending" : "active") as EntityStatus,
    };

    const supabase = createAdminClient();
    const { data, error } = await supabase.from("airports").insert(payload).select("*").single();

    if (!error && data) {
      return NextResponse.json({
        success: true,
        message: "Airport added with auto SEO and page URL.",
        airport: data,
      });
    }

    console.error("airport insert error:", error);

    if (useLocalStorage()) {
      const existing = await findLocalAirportByIata(iataCode);
      if (existing) {
        return NextResponse.json({ error: `Airport with IATA code ${iataCode} already exists.` }, { status: 409 });
      }

      const localAirport = await insertLocalAirport(payload);
      return NextResponse.json({
        success: true,
        message: "Airport saved locally with auto SEO and page URL.",
        airport: localAirport,
      });
    }

    return NextResponse.json({ error: formatStorageError(error) }, { status: 500 });
  } catch (error) {
    console.error("airports POST error:", error);
    return NextResponse.json({ error: "Unable to add airport." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    let deletedCount = 0;

    if (hasSupabaseConfig()) {
      try {
        const supabase = createAdminClient();
        deletedCount = await clearSupabaseTable(supabase, "airports");
      } catch (error) {
        console.error("airports clear-all error:", error);
        return NextResponse.json({ error: formatStorageError(error) }, { status: 500 });
      }
    } else {
      const localAirports = await readLocalAirports();
      deletedCount = localAirports.length;
    }

    await safeLocalClear(clearAllLocalAirports, "airports");

    return NextResponse.json({
      success: true,
      message: `All airports cleared (${deletedCount} removed).`,
      deleted: deletedCount,
    });
  } catch (error) {
    console.error("airports DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to clear airports." },
      { status: 500 },
    );
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
      return NextResponse.json({ error: "Airport id and status are required." }, { status: 400 });
    }

    if (body.status !== "pending" && body.status !== "active") {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("airports")
      .update({ status: body.status })
      .eq("id", body.id)
      .select("*")
      .single();

    if (!error && data) {
      return NextResponse.json({ airport: data });
    }

    if (useLocalStorage()) {
      const localAirport = await updateLocalAirportStatus(body.id, body.status);
      if (!localAirport) {
        return NextResponse.json({ error: "Airport not found." }, { status: 404 });
      }

      return NextResponse.json({ airport: localAirport });
    }

    console.error("airport status update error:", error);
    return NextResponse.json({ error: formatStorageError(error) }, { status: 500 });
  } catch (error) {
    console.error("airports PATCH error:", error);
    return NextResponse.json({ error: "Unable to update airport." }, { status: 500 });
  }
}
