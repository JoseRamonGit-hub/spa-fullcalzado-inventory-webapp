import type { PostgrestError } from "@supabase/supabase-js";
import { toServiceError } from "@/lib/errors";

const PAGE_SIZE = 500;

export async function readAllPages<Row>(query: {
  range: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: Row[]; error: null } | { data: null; error: PostgrestError }>;
}): Promise<Row[]> {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);
    if (error) throw toServiceError(error);
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}
