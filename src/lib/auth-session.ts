import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  decodePayload,
  getAdminEmail,
  getAuthSecret,
  getSessionTokenFromRequest,
  OTP_COOKIE,
  type OtpPayload,
  SESSION_COOKIE,
  type SessionPayload,
  validateSessionPayload,
} from "@/lib/auth-token";

function sign(data: string) {
  return createHmac("sha256", getAuthSecret()).update(data).digest("base64url");
}

function encodePayload(payload: object) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

function hashOtp(otp: string) {
  return createHmac("sha256", getAuthSecret()).update(otp).digest("hex");
}

export { getAdminEmail };

export function generateOtpCode() {
  return String(randomInt(100000, 999999));
}

export async function setOtpCookie(email: string, otp: string) {
  const cookieStore = await cookies();
  const payload: OtpPayload = {
    email: email.toLowerCase(),
    otpHash: hashOtp(otp),
    exp: Date.now() + 10 * 60 * 1000,
  };

  cookieStore.set(OTP_COOKIE, encodePayload(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
}

export async function verifyOtpCookie(email: string, otp: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(OTP_COOKIE)?.value;
  if (!token) return false;

  const [data, signature] = token.split(".");
  if (!data || !signature || sign(data) !== signature) return false;

  const payload = decodePayload<OtpPayload>(token);
  if (!payload) return false;
  if (payload.exp < Date.now()) return false;
  if (payload.email !== email.toLowerCase()) return false;

  const submittedHash = Buffer.from(hashOtp(otp));
  const storedHash = Buffer.from(payload.otpHash);
  if (submittedHash.length !== storedHash.length) return false;

  return timingSafeEqual(submittedHash, storedHash);
}

export async function clearOtpCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(OTP_COOKIE);
}

export async function setAdminSession(email: string) {
  const cookieStore = await cookies();
  const payload: SessionPayload = {
    email: email.toLowerCase(),
    role: "admin",
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  cookieStore.set(SESSION_COOKIE, encodePayload(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [data, signature] = token.split(".");
  if (!data || !signature || sign(data) !== signature) return null;

  const payload = decodePayload<SessionPayload>(token);
  return validateSessionPayload(payload);
}

export function getAdminSessionFromRequest(request: Request) {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;

  const [data, signature] = token.split(".");
  if (!data || !signature || sign(data) !== signature) return null;

  const payload = decodePayload<SessionPayload>(token);
  return validateSessionPayload(payload);
}
