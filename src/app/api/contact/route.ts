import { NextResponse } from "next/server";
import { buildEnquiryWhatsAppUrl, normalizeContactPayload } from "@/lib/enquiry";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<{
      name: string;
      phone: string;
      email: string;
      service: string;
      message: string;
    }>;

    const normalized = normalizeContactPayload(body);
    if ("error" in normalized) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("enquiries")
      .insert({
        name: normalized.data.name,
        phone: normalized.data.phone,
        email: normalized.data.email,
        service: normalized.data.service,
        message: normalized.data.message,
        status: "new",
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("contact insert error:", error);
      return NextResponse.json(
        {
          error:
            "Unable to save your enquiry right now. Please try WhatsApp or email us directly.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your enquiry has been submitted successfully.",
      enquiryId: data.id,
      whatsappUrl: buildEnquiryWhatsAppUrl(normalized.data),
    });
  } catch (error) {
    console.error("contact route error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
