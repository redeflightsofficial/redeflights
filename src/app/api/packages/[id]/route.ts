import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import {
  parseIncludesInput,
  normalizePackageTitle,
  resolveUniquePackageSlug,
  validatePackageTitle,
} from "@/lib/package-meta";
import { processPackageImageUpload, removePackageImageFile } from "@/lib/package-upload";
import { getPackageById, removePackageById, savePackageById } from "@/lib/package-store";
import { formatStorageError } from "@/lib/storage-mode";
import { createAdminClient } from "@/lib/supabase-admin";
import type { EntityStatus } from "@/types/airline";

async function parsePackagePatchRequest(request: Request) {
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await getPackageById(id);
    if (!existing) {
      return NextResponse.json({ error: "Package not found." }, { status: 404 });
    }

    const input = await parsePackagePatchRequest(request);
    const title = normalizePackageTitle(input.title || existing.title);
    const titleError = validatePackageTitle(title);
    if (titleError) {
      return NextResponse.json({ error: titleError }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: existingRows } = await supabase.from("tour_packages").select("slug, storage_path");
    const takenSlugs = new Set(
      (existingRows || [])
        .filter((item) => item.slug !== existing.slug)
        .map((item) => String(item.slug)),
    );
    const slug = title === existing.title ? existing.slug : resolveUniquePackageSlug(title, takenSlugs);

    let imageMeta: { image_url: string | null; storage_path: string | null };
    try {
      imageMeta = await processPackageImageUpload(input.file, {
        title,
        existingPaths: (existingRows || [])
          .map((item) => item.storage_path || "")
          .filter(Boolean),
        existingStoragePath: existing.storage_path,
        existingImageUrl: existing.image_url,
      });
    } catch (error) {
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

    const patch = {
      title,
      tag: input.tag || existing.tag,
      route: input.route || existing.route,
      duration: input.duration || existing.duration,
      region: input.region || existing.region,
      theme: input.theme || existing.theme,
      includes: input.includes ? parseIncludesInput(input.includes) : existing.includes,
      image_url: imageMeta.image_url,
      storage_path: imageMeta.storage_path,
      slug,
      sort_order:
        input.sort_order !== "" ? Number(input.sort_order || 0) || 0 : existing.sort_order,
      ...(input.status ? { status: input.status } : {}),
    };

    const tourPackage = await savePackageById(id, patch);
    if (!tourPackage) {
      return NextResponse.json({ error: formatStorageError(null) }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Tour package updated successfully.",
      package: tourPackage,
    });
  } catch (error) {
    console.error("package PATCH error:", error);
    return NextResponse.json({ error: "Unable to update package." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const tourPackage = await removePackageById(id);
    if (!tourPackage) {
      return NextResponse.json({ error: "Package not found." }, { status: 404 });
    }

    if (tourPackage.storage_path || tourPackage.image_url) {
      await removePackageImageFile(tourPackage.storage_path || "", tourPackage.image_url || "");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("package DELETE error:", error);
    return NextResponse.json({ error: "Unable to delete package." }, { status: 500 });
  }
}
