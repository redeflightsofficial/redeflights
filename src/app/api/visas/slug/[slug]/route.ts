import { NextResponse } from "next/server";
import { getVisaBySlug } from "@/lib/visa-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const visa = await getVisaBySlug(slug);

    if (!visa || visa.status !== "active") {
      return NextResponse.json({ error: "Visa service not found." }, { status: 404 });
    }

    return NextResponse.json({ visa });
  } catch (error) {
    console.error("visa slug GET error:", error);
    return NextResponse.json({ error: "Unable to load visa service." }, { status: 500 });
  }
}
