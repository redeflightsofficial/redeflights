import { NextResponse } from "next/server";
import {
  generateOtpCode,
  getAdminEmail,
  setOtpCookie,
} from "@/lib/auth-session";
import { buildOtpEmailPayload } from "@/lib/web3forms";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();
    const adminEmail = getAdminEmail();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (email !== adminEmail) {
      return NextResponse.json(
        { error: "This email is not authorized for admin access." },
        { status: 403 },
      );
    }

    const otp = generateOtpCode();
    await setOtpCookie(email, otp);

    // Web3Forms free plan: must send from browser, not server
    return NextResponse.json({
      success: true,
      message: "OTP is being sent. Check the inbox linked to your Web3Forms key.",
      emailPayload: buildOtpEmailPayload(otp),
    });
  } catch (error) {
    console.error("request-otp error:", error);
    const message =
      error instanceof Error && error.message.includes("WEB3FORMS")
        ? "Web3Forms is not configured. Add WEB3FORMS_ACCESS_KEY to .env.local."
        : error instanceof Error
          ? error.message
          : "Unable to send OTP right now. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
