import {
  decodePayload,
  getAuthSecret,
  getSessionTokenFromRequest,
  type SessionPayload,
  validateSessionPayload,
} from "@/lib/auth-token";

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(data: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifyToken(token: string) {
  const [data, signature] = token.split(".");
  if (!data || !signature) return false;
  const expected = await sign(data);
  return signature === expected;
}

export async function getAdminSessionFromRequest(request: Request) {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;
  if (!(await verifyToken(token))) return null;

  const payload = decodePayload<SessionPayload>(token);
  return validateSessionPayload(payload);
}
