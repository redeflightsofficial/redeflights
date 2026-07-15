import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import {
  getBannerFileExtension,
  sanitizeBannerBaseName,
} from "@/lib/banner-meta";
import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import { formatStorageError, useLocalStorage } from "@/lib/storage-mode";

export const PACKAGE_BUCKET = "packages";
export const PACKAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PACKAGE_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
export const PACKAGE_UPLOAD_DIR = "uploads/packages";

export function getPackagePublicUrl(supabaseUrl: string, storagePath: string) {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${PACKAGE_BUCKET}/${storagePath}`;
}

export function buildPackageStoragePath(
  fileName: string,
  existingNames: string[] = [],
  title = "",
) {
  const titleBase = sanitizeBannerBaseName(title);
  const fileBase = sanitizeBannerBaseName(fileName) || "package";
  const ext = getBannerFileExtension(fileName);
  const base = titleBase || fileBase;
  const taken = new Set(existingNames.map((item) => item.toLowerCase()));

  const first = `${base}.${ext}`;
  if (!taken.has(first.toLowerCase())) return first;

  let counter = 2;
  while (taken.has(`${base}-${counter}.${ext}`.toLowerCase())) {
    counter += 1;
  }

  return `${base}-${counter}.${ext}`;
}

async function savePackageImageLocally(fileBuffer: Buffer, storagePath: string) {
  const fullPath = path.join(process.cwd(), "public", PACKAGE_UPLOAD_DIR, storagePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, fileBuffer);
  return `/${PACKAGE_UPLOAD_DIR}/${storagePath}`;
}

export async function removePackageImageFile(storagePath: string, imageUrl: string) {
  const targets = new Set<string>();

  if (storagePath) {
    targets.add(path.join(process.cwd(), "public", PACKAGE_UPLOAD_DIR, storagePath));
  }

  if (imageUrl.startsWith("/")) {
    targets.add(path.join(process.cwd(), "public", imageUrl.replace(/^\//, "")));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (supabaseUrl && storagePath && hasSupabaseConfig() && !useLocalStorage()) {
    try {
      const supabase = createAdminClient();
      await supabase.storage.from(PACKAGE_BUCKET).remove([storagePath]);
    } catch (error) {
      console.error("package storage delete error:", formatStorageError(error));
    }
  }

  for (const filePath of targets) {
    try {
      await unlink(filePath);
    } catch {
      // ignore missing file
    }
  }
}

export async function processPackageImageUpload(
  file: FormDataEntryValue | null,
  options: {
    title?: string;
    existingStoragePath?: string | null;
    existingImageUrl?: string | null;
    existingPaths?: string[];
    requireFile?: boolean;
  } = {},
) {
  const keepExisting = {
    image_url: options.existingImageUrl || null,
    storage_path: options.existingStoragePath || null,
  };

  if (!(file instanceof File) || file.size === 0) {
    if (options.requireFile && !keepExisting.image_url) {
      throw new Error("FILE_REQUIRED");
    }
    return keepExisting;
  }

  if (!PACKAGE_ALLOWED_TYPES.includes(file.type)) {
    throw new Error("INVALID_TYPE");
  }

  if (file.size > PACKAGE_MAX_BYTES) {
    throw new Error("TOO_LARGE");
  }

  if (options.existingStoragePath || options.existingImageUrl) {
    await removePackageImageFile(
      options.existingStoragePath || "",
      options.existingImageUrl || "",
    );
  }

  const storagePath = buildPackageStoragePath(
    file.name,
    options.existingPaths || [],
    options.title || "",
  );
  const buffer = Buffer.from(await file.arrayBuffer());

  if (hasSupabaseConfig() && !useLocalStorage()) {
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(PACKAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      throw new Error(formatStorageError(error));
    }

    const imageUrl = getPackagePublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || "", storagePath);
    return { image_url: imageUrl, storage_path: storagePath };
  }

  const imageUrl = await savePackageImageLocally(buffer, storagePath);
  return { image_url: imageUrl, storage_path: storagePath };
}
