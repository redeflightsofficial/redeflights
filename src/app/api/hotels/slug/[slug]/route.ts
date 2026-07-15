import { NextResponse } from "next/server";
import { getHotelBySlug } from "@/lib/hotel-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const hotel = await getHotelBySlug(slug);

    if (!hotel || hotel.status !== "active") {
      return NextResponse.json({ error: "Hotel not found." }, { status: 404 });
    }

    return NextResponse.json({ hotel });
  } catch (error) {
    console.error("hotel slug route error:", error);
    return NextResponse.json({ error: "Unable to load hotel." }, { status: 500 });
  }
}
