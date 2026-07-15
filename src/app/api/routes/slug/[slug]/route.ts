import { NextResponse } from "next/server";
import { getRouteBySlug } from "@/lib/route-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const route = await getRouteBySlug(slug);

    if (!route || route.status !== "active") {
      return NextResponse.json({ error: "Flight not found." }, { status: 404 });
    }

    return NextResponse.json({ route });
  } catch (error) {
    console.error("route slug GET error:", error);
    return NextResponse.json({ error: "Unable to load flight." }, { status: 500 });
  }
}
