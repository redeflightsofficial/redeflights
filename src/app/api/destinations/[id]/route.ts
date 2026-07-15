import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { getSiteOrigin } from "@/lib/banner-meta";
import { buildManagedDestinationPayload } from "@/lib/destination-aggregate";
import { removeDestinationById, saveDestinationById } from "@/lib/destination-store";
import type { EntityStatus } from "@/types/airline";
import type { DestinationRecord } from "@/types/destination";

function normalizeTravelStyles(value: unknown) {
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
      title?: string;
      country?: string;
      subtitle?: string;
      region?: DestinationRecord["region"];
      travel_styles?: string[] | string;
      image_url?: string;
      packages_count?: number | string;
      popular_score?: number | string;
      status?: EntityStatus;
    };

    const title = String(body.title || "").trim();
    const country = String(body.country || "").trim();

    if (!title || !country) {
      return NextResponse.json({ error: "Destination title and country are required." }, { status: 400 });
    }

    const payload = buildManagedDestinationPayload(
      {
        title,
        country,
        subtitle: body.subtitle,
        region: body.region,
        travel_styles: normalizeTravelStyles(body.travel_styles) as DestinationRecord["travel_styles"],
        image_url: String(body.image_url || "").trim() || null,
        packages_count: Number(body.packages_count || 0),
        popular_score: Number(body.popular_score || 0),
        status: body.status,
      },
      getSiteOrigin(new URL(request.url).origin),
    );

    const destination = await saveDestinationById(id, payload);
    if (!destination) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    return NextResponse.json({ destination });
  } catch (error) {
    console.error("destination PATCH error:", error);
    return NextResponse.json({ error: "Unable to update destination." }, { status: 500 });
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
    const destination = await removeDestinationById(id);
    if (!destination) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("destination DELETE error:", error);
    return NextResponse.json({ error: "Unable to delete destination." }, { status: 500 });
  }
}
