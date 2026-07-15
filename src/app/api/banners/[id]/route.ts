import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import {
  BANNER_ALLOWED_TYPES,
  BANNER_BUCKET,
  BANNER_MAX_BYTES,
  buildBannerMetaFromFileName,
  buildBannerStoragePath,
  ensureDirectImageUrl,
  getSiteOrigin,
} from "@/lib/banner";
import { generateSlugFromFileName } from "@/lib/banner-meta";
import {
  deleteLocalBanner,
  getLocalBanner,
  removeBannerFile,
  saveBannerLocally,
  updateLocalBanner,
} from "@/lib/banner-local";
import { createAdminClient } from "@/lib/supabase-admin";
import type { BannerStatus } from "@/types/banner";

async function findBanner(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from("banners").select("*").eq("id", id).single();
  if (data) return { source: "supabase" as const, banner: data };
  const local = await getLocalBanner(id);
  if (local) return { source: "local" as const, banner: local };
  return null;
}

async function removeAllBannerAssets(storagePath: string, imageUrl: string) {
  const supabase = createAdminClient();
  await removeBannerFile(storagePath, imageUrl);
  if (storagePath) {
    await supabase.storage.from(BANNER_BUCKET).remove([storagePath]);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const contentType = request.headers.get("content-type") || "";
    const supabase = createAdminClient();
    const siteOrigin = getSiteOrigin(new URL(request.url).origin);

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const alt = String(formData.get("alt") || "").trim();
      const file = formData.get("file");
      const existing = await findBanner(id);

      if (!existing) {
        return NextResponse.json({ error: "Banner not found." }, { status: 404 });
      }

      let imageUrl = existing.banner.image_url;
      let storagePath = existing.banner.storage_path;
      let meta: ReturnType<typeof buildBannerMetaFromFileName> | null = null;

      if (file instanceof File && file.size > 0) {
        if (!BANNER_ALLOWED_TYPES.includes(file.type)) {
          return NextResponse.json({ error: "Only PNG, JPG, or WEBP images are allowed." }, { status: 400 });
        }
        if (file.size > BANNER_MAX_BYTES) {
          return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
        }

        await removeAllBannerAssets(existing.banner.storage_path, existing.banner.image_url);

        const rawBuffer = Buffer.from(await file.arrayBuffer());
        const fileBuffer = rawBuffer;
        storagePath = buildBannerStoragePath(file.name, [existing.banner.storage_path]);
        meta = buildBannerMetaFromFileName(storagePath, { siteOrigin });
        imageUrl = await saveBannerLocally(fileBuffer, storagePath, siteOrigin);

        await supabase.storage
          .from(BANNER_BUCKET)
          .upload(storagePath, fileBuffer, { contentType: file.type, upsert: true })
          .catch((error) => console.error("banner supabase backup upload error:", error));
      }

      const patch = {
        alt: alt || meta?.alt || existing.banner.alt,
        slug: meta?.slug || existing.banner.slug || generateSlugFromFileName(storagePath),
        seo_title: meta?.seoTitle ?? existing.banner.seo_title,
        meta_description: meta?.metaDescription ?? existing.banner.meta_description,
        h1_heading: meta?.h1Heading ?? existing.banner.h1_heading,
        image_url: imageUrl,
        storage_path: storagePath,
      };

      if (existing.source === "supabase") {
        const { data, error } = await supabase
          .from("banners")
          .update(patch)
          .eq("id", id)
          .select("*")
          .single();

        if (!error && data) return NextResponse.json({ banner: data });
      }

      const localBanner = await updateLocalBanner(id, patch);
      if (!localBanner) {
        return NextResponse.json({ error: "Unable to update banner." }, { status: 500 });
      }

      return NextResponse.json({ banner: localBanner });
    }

    const body = (await request.json()) as {
      alt?: string;
      status?: BannerStatus;
    };

    const patch: Partial<{ alt: string; status: BannerStatus }> = {};
    if (body.alt !== undefined) patch.alt = body.alt.trim() || "REDE I FLIGHTS Promotion";
    if (body.status !== undefined) patch.status = body.status;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("banners")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (!error && data) {
      return NextResponse.json({ banner: data });
    }

    const localBanner = await updateLocalBanner(id, patch);
    if (!localBanner) {
      return NextResponse.json({ error: "Banner not found." }, { status: 404 });
    }

    return NextResponse.json({ banner: localBanner });
  } catch (error) {
    console.error("banner PATCH error:", error);
    return NextResponse.json({ error: "Unable to update banner." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = getAdminSessionFromRequest(_request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const supabase = createAdminClient();

    const { data: remoteBanner } = await supabase
      .from("banners")
      .select("storage_path, image_url")
      .eq("id", id)
      .single();

    const localBanner = await getLocalBanner(id);
    const banner = remoteBanner || localBanner;

    if (!banner) {
      return NextResponse.json({ error: "Banner not found." }, { status: 404 });
    }

    if (remoteBanner) {
      await supabase.from("banners").delete().eq("id", id);
    }

    if (localBanner) {
      await deleteLocalBanner(id);
    }

    await removeAllBannerAssets(banner.storage_path, banner.image_url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("banner DELETE error:", error);
    return NextResponse.json({ error: "Unable to delete banner." }, { status: 500 });
  }
}
