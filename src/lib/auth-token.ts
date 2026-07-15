export const OTP_COOKIE = "admin_otp_pending";
export const SESSION_COOKIE = "admin_session";

export type OtpPayload = {
  email: string;
  otpHash: string;
  exp: number;
};

export type SessionPayload = {
  email: string;
  role: "admin";
  exp: number;
};

export function getAuthSecret() {
  return process.env.AUTH_SECRET || "rede-flights-dev-secret-change-me";
}

export function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || "yesr01164@gmail.com").trim().toLowerCase();
}

export function decodePayload<T>(token: string): T | null {
  const [data] = token.split(".");
  if (!data) return null;

  try {
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function getSessionTokenFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function validateSessionPayload(payload: SessionPayload | null) {
  if (!payload) return null;
  if (payload.exp < Date.now()) return null;
  if (payload.role !== "admin") return null;
  if (payload.email !== getAdminEmail()) return null;
  return payload;
}
