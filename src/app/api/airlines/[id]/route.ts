import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { buildAirlineSeo } from "@/lib/airline-meta";
import {
  deleteLocalAirline,
  markAirlineDeleted,
  updateLocalAirline,
} from "@/lib/airline-local";
import { getSiteOrigin } from "@/lib/banner-meta";
import { createAdminClient, hasSupabaseConfig, logSupabaseError } from "@/lib/supabase-admin";
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
      name?: string;
      iata_code?: string;
      icao_code?: string;
      country?: string;
      status?: EntityStatus;
    };

    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const name = String(body.name || "").trim();
    const iataCode = String(body.iata_code || "").trim().toUpperCase();

    if (!name || !iataCode) {
      return NextResponse.json({ error: "Airline name and IATA code are required." }, { status: 400 });
    }

    const seo = buildAirlineSeo(name, iataCode, String(body.country || "").trim(), siteOrigin);
    const patch = {
      name,
      iata_code: iataCode,
      icao_code: String(body.icao_code || "").trim().toUpperCase() || null,
      country: String(body.country || "").trim() || null,
      slug: seo.slug,
      seo_title: seo.seo_title,
      meta_description: seo.meta_description,
      h1_heading: seo.h1_heading,
      page_url: seo.page_url,
      status: body.status,
    };

    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("airlines")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (!error && data) {
        return NextResponse.json({ airline: data });
      }

      if (error) {
        logSupabaseError("airline update error:", error);
      }
    }

    const localAirline = await updateLocalAirline(id, patch);
    if (!localAirline) {
      return NextResponse.json({ error: "Airline not found." }, { status: 404 });
    }

    return NextResponse.json({ airline: localAirline });
  } catch (error) {
    console.error("airline PATCH error:", error);
    return NextResponse.json({ error: "Unable to update airline." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = getAdminSessionFromRequest(_request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    let deleted = false;
    let iataCode: string | null = null;

    if (hasSupabaseConfig()) {
      try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
          .from("airlines")
          .delete()
          .eq("id", id)
          .select("iata_code")
          .maybeSingle();

        if (!error && data) {
          deleted = true;
          iataCode = data.iata_code;
        } else if (error) {
          logSupabaseError("airline delete error:", error);
        }
      } catch (error) {
        logSupabaseError("airline delete error:", error);
      }
    }

    const localAirline = await deleteLocalAirline(id);
    if (localAirline) {
      deleted = true;
      iataCode = localAirline.iata_code;
    }

    if (!deleted) {
      return NextResponse.json({ error: "Airline not found." }, { status: 404 });
    }

    if (iataCode) {
      await markAirlineDeleted(iataCode);

      if (hasSupabaseConfig()) {
        try {
          const supabase = createAdminClient();
          await supabase.from("airlines").delete().eq("iata_code", iataCode);
        } catch (error) {
          logSupabaseError("airline delete by iata error:", error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("airline DELETE error:", error);
    return NextResponse.json({ error: "Unable to delete airline." }, { status: 500 });
  }
}
