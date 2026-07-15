import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { getSiteOrigin } from "@/lib/banner-meta";
import { mapAirportRows, parseExcelBuffer } from "@/lib/excel-import";
import { formatImportMessage, upsertImportedAirports } from "@/lib/import-upsert";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Excel file is required." }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls") && !fileName.endsWith(".csv")) {
      return NextResponse.json({ error: "Only .xlsx, .xls, or .csv files are allowed." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = mapAirportRows(parseExcelBuffer(buffer));

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No valid airport rows found. Use columns: Name, IATA, City, Country." },
        { status: 400 },
      );
    }

    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const supabase = createAdminClient();
    const stats = await upsertImportedAirports(supabase, rows, siteOrigin);

    return NextResponse.json({
      success: true,
      message: `${formatImportMessage("Airports", stats)}.`,
      inserted: stats.inserted,
      updated: stats.updated,
      errors: stats.errors,
      total: rows.length,
    });
  } catch (error) {
    console.error("airports import error:", error);
    return NextResponse.json({ error: "Unable to import airports from Excel." }, { status: 500 });
  }
}
