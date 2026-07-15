import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import { getRecentActivity } from "@/lib/recent-activity";

export async function GET(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 10), 1), 30);
    const activities = await getRecentActivity(limit);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("recent-activity GET error:", error);
    return NextResponse.json({ error: "Unable to load recent activity." }, { status: 500 });
  }
}
