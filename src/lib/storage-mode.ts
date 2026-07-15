import { hasSupabaseConfig } from "@/lib/supabase-admin";

/** Local JSON files are only used when Supabase env vars are not configured. */
export function useLocalStorage() {
  return !hasSupabaseConfig();
}

export function formatStorageError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Database operation failed.";
  }

  const record = error as { message?: string; code?: string };
  if (record.code === "PGRST205" || record.code === "42P01") {
    return "Database table missing. Run the SQL files in your Supabase SQL Editor.";
  }

  return record.message || "Database operation failed.";
}

export function mergeWithLocalById<T extends { id: string }>(primary: T[], local: T[]): T[] {
  if (!useLocalStorage()) return primary;

  const seen = new Set(primary.map((item) => item.id));
  const merged = [...primary];
  for (const item of local) {
    if (!seen.has(item.id)) merged.push(item);
  }
  return merged;
}

export function mergeWithLocalByCode<T extends { iata_code: string }>(primary: T[], local: T[]): T[] {
  if (!useLocalStorage()) return primary;

  const seen = new Set(primary.map((item) => item.iata_code.toUpperCase()));
  const merged = [...primary];
  for (const item of local) {
    const code = item.iata_code.toUpperCase();
    if (!seen.has(code)) {
      merged.push(item);
      seen.add(code);
    }
  }
  return merged;
}
