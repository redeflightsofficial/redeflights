import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth-session";
import {
  BANNER_ALLOWED_TYPES,
  BANNER_BUCKET,
  BANNER_MAX_BYTES,
  buildBannerMetaFromFileName,
  buildBannerStoragePath,
  ensureDirectImageUrl,
  getBannerPublicUrl,
  getSiteOrigin,
} from "@/lib/banner";
import {
  insertLocalBanner,
  readLocalBanners,
  saveBannerLocally,
  updateLocalBannerStatus,
} from "@/lib/banner-local";
import { formatStorageError, mergeWithLocalById, useLocalStorage } from "@/lib/storage-mode";
import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import { withQueryTimeout } from "@/lib/supabase-query";
import type { Banner, BannerStatus } from "@/types/banner";

async function loadBanners(activeOnly: boolean, siteOrigin = getSiteOrigin()) {
  const localBanners = await readLocalBanners();
  const filteredLocal = activeOnly
    ? localBanners.filter((item) => item.status === "active")
    : localBanners;

  let banners: Banner[] = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      let query = supabase.from("banners").select("*").order("created_at", { ascending: false });

      if (activeOnly) {
        query = query.eq("status", "active");
      }

      const { data, error } = await withQueryTimeout(query, 4000, "banners fetch");
      banners = data ?? [];

      if (error) {
        console.error("banners fetch error:", error);
        banners = [];
      }
    } catch (error) {
      console.error("banners fetch error:", error);
      banners = [];
    }
  }

  banners = mergeWithLocalById(banners, filteredLocal);

  banners.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return banners.map((banner) => ({
    ...banner,
    image_url: ensureDirectImageUrl(banner.image_url, { siteOrigin }),
  }));
}

function buildStats(banners: Banner[]) {
  return {
    total: banners.length,
    pending: banners.filter((item) => item.status === "pending").length,
    active: banners.filter((item) => item.status === "active").length,
  };
}

export async function GET(request: Request) {
  try {
    let session = null;
    try {
      session = getAdminSessionFromRequest(request);
    } catch (error) {
      console.error("banners session parse error:", error);
    }

    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const banners = await loadBanners(!session, siteOrigin);

    if (session) {
      return NextResponse.json({ banners, stats: buildStats(banners) });
    }

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("banners GET error:", error);
    return NextResponse.json({ banners: [] });
  }
}

export async function POST(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const alt = String(formData.get("alt") || "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Banner image file is required." }, { status: 400 });
    }

    if (!BANNER_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPG, or WEBP images are allowed." },
        { status: 400 },
      );
    }

    if (file.size > BANNER_MAX_BYTES) {
      return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
    }

    const siteOrigin = getSiteOrigin(new URL(request.url).origin);
    const existingBanners = await loadBanners(false, siteOrigin);
    const existingNames = existingBanners.map((item) => item.storage_path);
    const storagePath = buildBannerStoragePath(file.name, existingNames);
    const meta = buildBannerMetaFromFileName(storagePath, { siteOrigin });
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const fileBuffer = rawBuffer;
    const supabase = createAdminClient();
    let imageUrl = "";

    if (useLocalStorage()) {
      imageUrl = await saveBannerLocally(fileBuffer, storagePath, siteOrigin);
    } else {
      const { error: uploadError } = await supabase.storage
        .from(BANNER_BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("banner supabase upload error:", uploadError);
        return NextResponse.json({ error: formatStorageError(uploadError) }, { status: 500 });
      }

      imageUrl = getBannerPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || "", storagePath);
    }

    const payload = {
      alt: alt || meta.alt,
      slug: meta.slug,
      seo_title: meta.seoTitle,
      meta_description: meta.metaDescription,
      h1_heading: meta.h1Heading,
      image_url: imageUrl,
      storage_path: storagePath,
      status: "active" as const,
    };

    const { data, error } = await supabase
      .from("banners")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("banner insert error:", error);

      if (useLocalStorage()) {
        const localBanner = await insertLocalBanner(payload);
        return NextResponse.json({
          success: true,
          message: "Banner uploaded and activated.",
          banner: localBanner,
        });
      }

      return NextResponse.json({ error: formatStorageError(error) }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Banner uploaded and activated.",
      banner: data,
    });
  } catch (error) {
    console.error("banners POST error:", error);
    return NextResponse.json({ error: "Unable to upload banner." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { id?: string; status?: BannerStatus };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "Banner id and status are required." }, { status: 400 });
    }

    if (body.status !== "pending" && body.status !== "active") {
      return NextResponse.json({ error: "Invalid banner status." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("banners")
      .update({ status: body.status })
      .eq("id", body.id)
      .select("*")
      .single();

    if (!error && data) {
      return NextResponse.json({ banner: data });
    }

    if (useLocalStorage()) {
      const localBanner = await updateLocalBannerStatus(body.id, body.status);
      if (!localBanner) {
        return NextResponse.json({ error: "Banner not found." }, { status: 404 });
      }

      return NextResponse.json({ banner: localBanner });
    }

    console.error("banner status update error:", error);
    return NextResponse.json({ error: formatStorageError(error) }, { status: 500 });
  } catch (error) {
    console.error("banners PATCH error:", error);
    return NextResponse.json({ error: "Unable to update banner." }, { status: 500 });
  }
}
