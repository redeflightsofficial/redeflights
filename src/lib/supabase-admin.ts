import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceRoleKey || anonKey;

  if (!url || !key) {
    throw new Error("Missing Supabase configuration for server operations.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function hasSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

function getSupabaseErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { code: "", message: "" };
  }

  const record = error as { code?: string; message?: string };
  return {
    code: record.code ?? "",
    message: record.message ?? "",
  };
}

export function isIgnorableSupabaseError(error: unknown) {
  const { code, message } = getSupabaseErrorDetails(error);

  return (
    code === "PGRST205" ||
    code === "42P01" ||
    /does not exist|could not find the table/i.test(message)
  );
}

export function logSupabaseError(label: string, error: unknown) {
  if (!isIgnorableSupabaseError(error)) {
    console.error(label, error);
  }
}
