// PostgREST limits each response. A busy monthly roster can exceed that limit.
export async function readAllRows<T>(readPage: (from: number, to: number) => PromiseLike<{
  data: T[] | null;
  error: unknown;
  count: number | null;
}>) {
  const rows: T[] = [];
  for (;;) {
    const result = await readPage(rows.length, rows.length + 499);
    if (result.error) return { data: null, error: result.error };
    const page = result.data ?? [];
    rows.push(...page);
    if (result.count !== null && rows.length >= result.count) return { data: rows, error: null };
    if (!page.length) {
      if (result.count !== null && rows.length < result.count) {
        return { data: null, error: new Error("The calendar response was incomplete.") };
      }
      return { data: rows, error: null };
    }
    if (result.count === null && page.length < 500) return { data: rows, error: null };
  }
}
