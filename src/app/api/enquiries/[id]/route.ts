import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { createAdminClient } from "@/lib/supabase-admin";

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
    if (!id) {
      return NextResponse.json({ error: "Enquiry id is required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.from("enquiries").delete().eq("id", id).select("id").maybeSingle();

    if (error) {
      console.error("enquiry delete error:", error);
      return NextResponse.json({ error: "Unable to delete enquiry." }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("enquiry DELETE error:", error);
    return NextResponse.json({ error: "Unable to delete enquiry." }, { status: 500 });
  }
}
