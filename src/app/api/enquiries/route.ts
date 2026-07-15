import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { createAdminClient } from "@/lib/supabase-admin";
import type { EnquiryStatus } from "@/types/enquiry";

export async function GET(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("enquiries fetch error:", error);
      return NextResponse.json({ error: "Unable to load enquiries." }, { status: 500 });
    }

    return NextResponse.json({ enquiries: data ?? [] });
  } catch (error) {
    console.error("enquiries GET error:", error);
    return NextResponse.json({ error: "Unable to load enquiries." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { id?: string; status?: EnquiryStatus };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "Enquiry id and status are required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("enquiries")
      .update({ status: body.status })
      .eq("id", body.id)
      .select("*")
      .single();

    if (error) {
      console.error("enquiry update error:", error);
      return NextResponse.json({ error: "Unable to update enquiry." }, { status: 500 });
    }

    return NextResponse.json({ enquiry: data });
  } catch (error) {
    console.error("enquiries PATCH error:", error);
    return NextResponse.json({ error: "Unable to update enquiry." }, { status: 500 });
  }
}
