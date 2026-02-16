import { supabase } from "./supabaseClient";

export async function fetchAllFromSupabase<T>(
  tableOrView: string,
  queryBuilder: (q: any) => any,
  pageSize = 1000
): Promise<T[]> {
  let all: T[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;

    const q = supabase.from(tableOrView).select("*");
    const { data, error } = await queryBuilder(q).range(from, to);

    if (error) throw new Error(error.message);

    const chunk = (data ?? []) as T[];
    all = all.concat(chunk);

    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  return all;
}
