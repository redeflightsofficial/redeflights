import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import {
  getBannerFileExtension,
  sanitizeBannerBaseName,
} from "@/lib/banner-meta";
import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import { formatStorageError, useLocalStorage } from "@/lib/storage-mode";
import { normalizeVisaImageUrl, toVisaImageSrc } from "@/lib/visa-display";

export const VISA_BUCKET = "visas";
export const VISA_MAX_BYTES = 5 * 1024 * 1024;
export const VISA_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
export const VISA_UPLOAD_DIR = "uploads/visas";

export function getVisaPublicUrl(supabaseUrl: string, storagePath: string) {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${VISA_BUCKET}/${storagePath}`;
}

export function buildVisaStoragePath(
  fileName: string,
  existingNames: string[] = [],
  country = "",
) {
  const countryBase = sanitizeBannerBaseName(country);
  const fileBase = sanitizeBannerBaseName(fileName) || "visa";
  const ext = getBannerFileExtension(fileName);
  const base = countryBase ? `${countryBase}-visa` : fileBase;
  const taken = new Set(existingNames.map((item) => item.toLowerCase()));

  const first = `${VISA_UPLOAD_DIR}/${base}.${ext}`;
  if (!taken.has(first.toLowerCase())) return first;

  let counter = 2;
  while (taken.has(`${VISA_UPLOAD_DIR}/${base}-${counter}.${ext}`.toLowerCase())) {
    counter += 1;
  }

  return `${VISA_UPLOAD_DIR}/${base}-${counter}.${ext}`;
}

async function ensureVisaStorageBucket() {
  const supabase = createAdminClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(formatStorageError(listError));
  }

  if (buckets?.some((bucket) => bucket.id === VISA_BUCKET)) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(VISA_BUCKET, {
    public: true,
  });
  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(formatStorageError(createError));
  }
}

export async function saveVisaImageLocally(fileBuffer: Buffer, storagePath: string) {
  const publicDir = path.join(process.cwd(), "public");
  const fullPath = path.join(publicDir, storagePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, fileBuffer);
  return `/${storagePath}`;
}

export async function removeVisaImageFile(storagePath: string, imageUrl: string) {
  const publicDir = path.join(process.cwd(), "public");
  const targets = new Set<string>();

  if (storagePath) {
    targets.add(path.join(publicDir, storagePath));
  }

  if (imageUrl.startsWith("/")) {
    targets.add(path.join(process.cwd(), "public", imageUrl));
  }

  const fileName = imageUrl?.split("?")[0].split("/").pop();
  if (fileName) {
    targets.add(path.join(publicDir, VISA_UPLOAD_DIR, fileName));
  }

  if (storagePath && hasSupabaseConfig() && !useLocalStorage()) {
    try {
      const supabase = createAdminClient();
      await supabase.storage.from(VISA_BUCKET).remove([storagePath]);
    } catch (error) {
      console.error("visa storage delete error:", formatStorageError(error));
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

export async function processVisaImageUpload(
  file: FormDataEntryValue | null,
  imageUrlInput: string,
  siteOrigin: string,
  options: {
    existingStoragePath?: string | null;
    existingImageUrl?: string | null;
    country?: string;
    existingPaths?: string[];
  } = {},
) {
  let imageUrl =
    normalizeVisaImageUrl(imageUrlInput) || options.existingImageUrl || null;
  let storagePath = options.existingStoragePath || null;

  if (!(file instanceof File) || file.size === 0) {
    return {
      image_url: imageUrl ? toVisaImageSrc(imageUrl) : null,
      storage_path: storagePath,
    };
  }

  if (!VISA_ALLOWED_TYPES.includes(file.type)) {
    throw new Error("INVALID_TYPE");
  }

  if (file.size > VISA_MAX_BYTES) {
    throw new Error("TOO_LARGE");
  }

  if (options.existingStoragePath || options.existingImageUrl) {
    await removeVisaImageFile(
      options.existingStoragePath || "",
      options.existingImageUrl || "",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  storagePath = buildVisaStoragePath(
    file.name,
    options.existingPaths || [],
    options.country || "",
  );

  if (hasSupabaseConfig() && !useLocalStorage()) {
    await ensureVisaStorageBucket();
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(VISA_BUCKET).upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

    if (error) {
      throw new Error(formatStorageError(error));
    }

    imageUrl = getVisaPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || siteOrigin, storagePath);
  } else {
    imageUrl = await saveVisaImageLocally(buffer, storagePath);
  }

  return {
    image_url: imageUrl ? toVisaImageSrc(imageUrl) : null,
    storage_path: storagePath,
  };
}
