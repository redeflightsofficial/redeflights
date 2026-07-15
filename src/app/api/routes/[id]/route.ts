import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { getSiteOrigin } from "@/lib/banner-meta";
import { upsertLinkedEntities } from "@/lib/link-route-entities";
import { buildRouteSeo, sanitizeAirportIataCode } from "@/lib/route-meta";
import { removeRouteById, saveRouteById } from "@/lib/route-store";
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
    const body = (await request.json()) as {
      from_city?: string;
      to_city?: string;
      airline_name?: string;
      from_airport_code?: string;
      to_airport_code?: string;
      status?: EntityStatus;
    };

    const fromCity = String(body.from_city || "").trim();
    const toCity = String(body.to_city || "").trim();
    if (!fromCity || !toCity) {
      return NextResponse.json({ error: "From and To are required." }, { status: 400 });
    }

    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const airlineName = String(body.airline_name || "").trim();
    const fromAirportCode = sanitizeAirportIataCode(body.from_airport_code);
    const toAirportCode = sanitizeAirportIataCode(body.to_airport_code);
    const seo = buildRouteSeo(
      fromCity,
      toCity,
      siteOrigin,
      airlineName,
      fromAirportCode || "",
      toAirportCode || "",
    );
    const patch = {
      from_city: fromCity,
      to_city: toCity,
      from_airport_code: fromAirportCode,
      to_airport_code: toAirportCode,
      airline_name: airlineName || null,
      slug: seo.slug,
      og_title: seo.og_title,
      og_description: seo.og_description,
      seo_keywords: seo.seo_keywords,
      seo_title: seo.seo_title,
      meta_description: seo.meta_description,
      h1_heading: seo.h1_heading,
      page_url: seo.page_url,
      ...(body.status ? { status: body.status } : {}),
    };

    const route = await saveRouteById(id, patch);
    if (!route) {
      return NextResponse.json({ error: "Route not found." }, { status: 404 });
    }

    await upsertLinkedEntities(
      {
        airline_name: airlineName,
        from_airport_code: patch.from_airport_code || undefined,
        to_airport_code: patch.to_airport_code || undefined,
        from_city: fromCity,
        to_city: toCity,
      },
      siteOrigin,
    );

    return NextResponse.json({ route });
  } catch (error) {
    console.error("route PATCH error:", error);
    return NextResponse.json({ error: "Unable to update route." }, { status: 500 });
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
    const route = await removeRouteById(id);
    if (!route) {
      return NextResponse.json({ error: "Route not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("route DELETE error:", error);
    return NextResponse.json({ error: "Unable to delete route." }, { status: 500 });
  }
}
