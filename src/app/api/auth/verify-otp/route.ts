import { NextResponse } from "next/server";
import {
  clearOtpCookie,
  getAdminEmail,
  setAdminSession,
  verifyOtpCookie,
} from "@/lib/auth-session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; otp?: string };
    const email = body.email?.trim().toLowerCase();
    const otp = body.otp?.trim();
    const adminEmail = getAdminEmail();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
    }

    if (email !== adminEmail) {
      return NextResponse.json({ error: "Unauthorized email." }, { status: 403 });
    }

    const isValid = await verifyOtpCookie(email, otp);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 401 });
    }

    await clearOtpCookie();
    await setAdminSession(email);

    return NextResponse.json({
      success: true,
      message: "Login successful.",
    });
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json({ error: "Unable to verify OTP." }, { status: 500 });
  }
}
