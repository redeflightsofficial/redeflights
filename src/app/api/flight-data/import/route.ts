import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const target = `${url.origin}/api/routes/import`;
  const formData = await request.formData();
  const response = await fetch(target, {
    method: "POST",
    headers: { cookie: request.headers.get("cookie") || "" },
    body: formData,
  });
  const result = await response.json();
  return NextResponse.json(result, { status: response.status });
}
