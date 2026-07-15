import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth-session";

export async function GET() {
  const session = await getAdminSession();
  return NextResponse.json({
    authenticated: Boolean(session),
    email: session?.email ?? null,
  });
}
