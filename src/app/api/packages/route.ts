import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import {
  includesToText,
  parseIncludesInput,
  normalizePackageTitle,
  resolveUniquePackageSlug,
  validatePackageTitle,
} from "@/lib/package-meta";
import { processPackageImageUpload } from "@/lib/package-upload";
import { formatStorageError } from "@/lib/storage-mode";
import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import { withQueryTimeout } from "@/lib/supabase-query";
import type { EntityStatus } from "@/types/airline";
import type { TourPackage } from "@/types/tour-package";

async function parsePackageRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return {
      title: String(formData.get("title") || "").trim(),
      tag: String(formData.get("tag") || "").trim(),
      route: String(formData.get("route") || "").trim(),
      duration: String(formData.get("duration") || "").trim(),
      region: String(formData.get("region") || "").trim(),
      theme: String(formData.get("theme") || "").trim(),
      includes: String(formData.get("includes") || "").trim(),
      sort_order: String(formData.get("sort_order") || "").trim(),
      status: String(formData.get("status") || "").trim() as EntityStatus | "",
      file: formData.get("file"),
    };
  }

  const body = (await request.json()) as {
    title?: string;
    tag?: string;
    route?: string;
    duration?: string;
    region?: string;
    theme?: string;
    includes?: string | string[];
    sort_order?: number | string;
    status?: EntityStatus;
  };

  return {
    title: String(body.title || "").trim(),
    tag: String(body.tag || "").trim(),
    route: String(body.route || "").trim(),
    duration: String(body.duration || "").trim(),
    region: String(body.region || "").trim(),
    theme: String(body.theme || "").trim(),
    includes: Array.isArray(body.includes) ? body.includes.join(", ") : String(body.includes || "").trim(),
    sort_order: String(body.sort_order ?? "").trim(),
    status: body.status || ("" as const),
    file: null,
  };
}

async function loadPackages(activeOnly: boolean) {
  if (!hasSupabaseConfig()) return [];

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("tour_packages")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (activeOnly) query = query.eq("status", "active");

    const { data, error } = await withQueryTimeout(query, 5000, "packages fetch");
    if (error) {
      console.error("packages fetch error:", error);
      return [];
    }

    return (data ?? []) as TourPackage[];
  } catch (error) {
    console.error("packages fetch error:", error);
    return [];
  }
}

function buildStats(packages: TourPackage[]) {
  return {
    total: packages.length,
    pending: packages.filter((item) => item.status === "pending").length,
    active: packages.filter((item) => item.status === "active").length,
  };
}

export async function GET(request: Request) {
  try {
    let session = null;
    try {
      session = getAdminSessionFromRequest(request);
    } catch (error) {
      console.error("packages session parse error:", error);
    }

    const packages = await loadPackages(!session);
    if (session) {
      return NextResponse.json({ packages, stats: buildStats(packages) });
    }
    return NextResponse.json({ packages });
  } catch (error) {
    console.error("packages GET error:", error);
    return NextResponse.json({ packages: [] });
  }
}

export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const input = await parsePackageRequest(request);
    const title = normalizePackageTitle(input.title);
    const titleError = validatePackageTitle(title);
    if (titleError) {
      return NextResponse.json({ error: titleError }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: existingRows } = await supabase.from("tour_packages").select("slug, storage_path");
    const takenSlugs = new Set((existingRows || []).map((item) => String(item.slug)));
    const slug = resolveUniquePackageSlug(input.title, takenSlugs);

    let imageMeta: { image_url: string | null; storage_path: string | null };
    try {
      imageMeta = await processPackageImageUpload(input.file, {
        title,
        existingPaths: (existingRows || [])
          .map((item) => item.storage_path || "")
          .filter(Boolean),
        requireFile: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "FILE_REQUIRED") {
        return NextResponse.json({ error: "Package image is required." }, { status: 400 });
      }
      if (error instanceof Error && error.message === "INVALID_TYPE") {
        return NextResponse.json(
          { error: "Only PNG, JPG, or WEBP images are allowed." },
          { status: 400 },
        );
      }
      if (error instanceof Error && error.message === "TOO_LARGE") {
        return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
      }
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    const payload = {
      title,
      tag: input.tag || "Popular",
      route: input.route,
      duration: input.duration,
      region: input.region,
      theme: input.theme,
      includes: parseIncludesInput(input.includes),
      image_url: imageMeta.image_url,
      storage_path: imageMeta.storage_path,
      slug,
      sort_order: Number(input.sort_order || 0) || 0,
      status: (input.status === "pending" ? "pending" : "active") as EntityStatus,
    };

    const { data, error } = await supabase.from("tour_packages").insert(payload).select("*").single();
    if (error || !data) {
      console.error("package insert error:", error);
      return NextResponse.json({ error: formatStorageError(error) }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Tour package added successfully.",
      package: data,
    });
  } catch (error) {
    console.error("packages POST error:", error);
    return NextResponse.json({ error: "Unable to add tour package." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { id?: string; status?: EntityStatus };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "Package id and status are required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tour_packages")
      .update({ status: body.status })
      .eq("id", body.id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Package not found." }, { status: 404 });
    }

    return NextResponse.json({ package: data });
  } catch (error) {
    console.error("packages PATCH error:", error);
    return NextResponse.json({ error: "Unable to update package." }, { status: 500 });
  }
}
