import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { buildAirportSeo } from "@/lib/airport-meta";
import {
  deleteLocalAirport,
  markAirportDeleted,
  updateLocalAirport,
} from "@/lib/airport-local";
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
    const patch = {
      name,
      iata_code: iataCode,
      city,
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
        .from("airports")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (!error && data) {
        return NextResponse.json({ airport: data });
      }

      if (error) {
        logSupabaseError("airport update error:", error);
      }
    }

    const localAirport = await updateLocalAirport(id, patch);
    if (!localAirport) {
      return NextResponse.json({ error: "Airport not found." }, { status: 404 });
    }

    return NextResponse.json({ airport: localAirport });
  } catch (error) {
    console.error("airport PATCH error:", error);
    return NextResponse.json({ error: "Unable to update airport." }, { status: 500 });
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
          .from("airports")
          .delete()
          .eq("id", id)
          .select("iata_code")
          .maybeSingle();

        if (!error && data) {
          deleted = true;
          iataCode = data.iata_code;
        } else if (error) {
          logSupabaseError("airport delete error:", error);
        }
      } catch (error) {
        logSupabaseError("airport delete error:", error);
      }
    }

    const localAirport = await deleteLocalAirport(id);
    if (localAirport) {
      deleted = true;
      iataCode = localAirport.iata_code;
    }

    if (!deleted) {
      return NextResponse.json({ error: "Airport not found." }, { status: 404 });
    }

    if (iataCode) {
      await markAirportDeleted(iataCode);

      if (hasSupabaseConfig()) {
        try {
          const supabase = createAdminClient();
          await supabase.from("airports").delete().eq("iata_code", iataCode);
        } catch (error) {
          logSupabaseError("airport delete by iata error:", error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("airport DELETE error:", error);
    return NextResponse.json({ error: "Unable to delete airport." }, { status: 500 });
  }
}
