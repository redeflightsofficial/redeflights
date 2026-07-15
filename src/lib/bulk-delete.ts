import { isIgnorableSupabaseError } from "@/lib/supabase-admin";
import type { SupabaseClient } from "@supabase/supabase-js";

const BATCH_SIZE = 100;

export async function clearSupabaseTable(supabase: SupabaseClient, table: string) {
  let deletedCount = 0;

  while (true) {
    const { data: rows, error: selectError } = await supabase
      .from(table)
      .select("id")
      .limit(BATCH_SIZE);

    if (selectError) {
      if (isIgnorableSupabaseError(selectError)) return deletedCount;
      throw selectError;
    }

    if (!rows?.length) break;

    const ids = rows.map((row) => String(row.id));
    const { error: deleteError } = await supabase.from(table).delete().in("id", ids);
    if (deleteError) throw deleteError;

    deletedCount += ids.length;
    if (rows.length < BATCH_SIZE) break;
  }

  return deletedCount;
}

export async function safeLocalClear(task: () => Promise<unknown>, label: string) {
  try {
    await task();
  } catch (error) {
    console.warn(`${label} local clear skipped:`, error);
  }
}
