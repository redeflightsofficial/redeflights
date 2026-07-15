import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { buildAirlineSeo } from "@/lib/airline-meta";
import {
  clearAllLocalAirlines,
  findLocalAirlineByIata,
  insertLocalAirline,
  readDeletedAirlineCodes,
  readLocalAirlines,
  updateLocalAirlineStatus,
} from "@/lib/airline-local";
import { clearSupabaseTable, safeLocalClear } from "@/lib/bulk-delete";
import { getSiteOrigin } from "@/lib/banner-meta";
import { syncLocalAirlinesFromRoutes } from "@/lib/link-route-entities";
import { formatStorageError, mergeWithLocalByCode, useLocalStorage } from "@/lib/storage-mode";
import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import { withQueryTimeout } from "@/lib/supabase-query";
import type { Airline, EntityStatus } from "@/types/airline";

async function loadAirlines(activeOnly: boolean, siteOrigin = getSiteOrigin()) {
  await syncLocalAirlinesFromRoutes(siteOrigin);

  const supabase = createAdminClient();
  let query = supabase.from("airlines").select("*").order("created_at", { ascending: false });
  if (activeOnly) query = query.eq("status", "active");

  let airlines: Airline[] = [];

  try {
    const { data, error } = await withQueryTimeout(query, 5000, "airlines fetch");
    airlines = (data ?? []) as Airline[];
    if (error) {
      console.error("airlines fetch error:", error);
      airlines = [];
    }
  } catch (error) {
    console.error("airlines fetch error:", error);
    airlines = [];
  }

  const localAirlines = await readLocalAirlines();
  const filteredLocal = activeOnly
    ? localAirlines.filter((item) => item.status === "active")
    : localAirlines;

  airlines = mergeWithLocalByCode(airlines, filteredLocal);

  airlines.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const deletedCodes = new Set((await readDeletedAirlineCodes()).map((code) => code.toUpperCase()));
  airlines = airlines.filter((item) => !deletedCodes.has(item.iata_code.toUpperCase()));

  return airlines.map((item) => {
    const seo = buildAirlineSeo(item.name, item.iata_code, item.country || "", siteOrigin);
    return {
      ...item,
      page_url: item.page_url || seo.page_url,
    };
  });
}

function buildStats(airlines: Airline[]) {
  return {
    total: airlines.length,
    pending: airlines.filter((item) => item.status === "pending").length,
    active: airlines.filter((item) => item.status === "active").length,
  };
}

export async function GET(request: Request) {
  try {
    const session = getAdminSessionFromRequest(request);
    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const airlines = await loadAirlines(!session, siteOrigin);

    if (session) {
      return NextResponse.json({ airlines, stats: buildStats(airlines) });
    }

    return NextResponse.json({ airlines });
  } catch (error) {
    console.error("airlines GET error:", error);
    return NextResponse.json({ error: "Unable to load airlines." }, { status: 500 });
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
      icao_code?: string;
      country?: string;
      status?: EntityStatus;
    };

    const name = String(body.name || "").trim();
    const iataCode = String(body.iata_code || "").trim().toUpperCase();

    if (!name || !iataCode) {
      return NextResponse.json({ error: "Airline name and IATA code are required." }, { status: 400 });
    }

    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const seo = buildAirlineSeo(name, iataCode, String(body.country || "").trim(), siteOrigin);

    const payload = {
      name,
      iata_code: iataCode,
      icao_code: String(body.icao_code || "").trim().toUpperCase() || null,
      country: String(body.country || "").trim() || null,
      slug: seo.slug,
      seo_title: seo.seo_title,
      meta_description: seo.meta_description,
      h1_heading: seo.h1_heading,
      page_url: seo.page_url,
      status: (body.status === "pending" ? "pending" : "active") as EntityStatus,
    };

    const supabase = createAdminClient();
    const { data, error } = await supabase.from("airlines").insert(payload).select("*").single();

    if (!error && data) {
      return NextResponse.json({
        success: true,
        message: "Airline added with auto SEO and page URL.",
        airline: data,
      });
    }

    console.error("airline insert error:", error);

    if (useLocalStorage()) {
      const existing = await findLocalAirlineByIata(iataCode);
      if (existing) {
        return NextResponse.json({ error: `Airline with IATA code ${iataCode} already exists.` }, { status: 409 });
      }

      const localAirline = await insertLocalAirline(payload);
      return NextResponse.json({
        success: true,
        message: "Airline saved locally with auto SEO and page URL.",
        airline: localAirline,
      });
    }

    return NextResponse.json({ error: formatStorageError(error) }, { status: 500 });
  } catch (error) {
    console.error("airlines POST error:", error);
    return NextResponse.json({ error: "Unable to add airline." }, { status: 500 });
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
        deletedCount = await clearSupabaseTable(supabase, "airlines");
      } catch (error) {
        console.error("airlines clear-all error:", error);
        return NextResponse.json({ error: formatStorageError(error) }, { status: 500 });
      }
    } else {
      const localAirlines = await readLocalAirlines();
      deletedCount = localAirlines.length;
    }

    await safeLocalClear(clearAllLocalAirlines, "airlines");

    return NextResponse.json({
      success: true,
      message: `All airlines cleared (${deletedCount} removed).`,
      deleted: deletedCount,
    });
  } catch (error) {
    console.error("airlines DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to clear airlines." },
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
      return NextResponse.json({ error: "Airline id and status are required." }, { status: 400 });
    }

    if (body.status !== "pending" && body.status !== "active") {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("airlines")
      .update({ status: body.status })
      .eq("id", body.id)
      .select("*")
      .single();

    if (!error && data) {
      return NextResponse.json({ airline: data });
    }

    if (useLocalStorage()) {
      const localAirline = await updateLocalAirlineStatus(body.id, body.status);
      if (!localAirline) {
        return NextResponse.json({ error: "Airline not found." }, { status: 404 });
      }

      return NextResponse.json({ airline: localAirline });
    }

    console.error("airline status update error:", error);
    return NextResponse.json({ error: formatStorageError(error) }, { status: 500 });
  } catch (error) {
    console.error("airlines PATCH error:", error);
    return NextResponse.json({ error: "Unable to update airline." }, { status: 500 });
  }
}
