import { NextResponse } from "next/server";
import {
  generateOtpCode,
  getAdminEmail,
  setOtpCookie,
} from "@/lib/auth-session";
import { sendOtpEmail } from "@/lib/send-otp-email";

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
    await sendOtpEmail(email, otp);

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${adminEmail}. Check inbox and spam.`,
    });
  } catch (error) {
    console.error("request-otp error:", error);
    const message =
      error instanceof Error ? error.message : "Unable to send OTP right now. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
