import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Purchase } from "@repo/shared/types";
import { api } from "@/lib/api";

// Re-exported because the generated screens import it from here. The
// definition itself lives in packages/shared, so grit sync reaches it: a local
// copy could not be updated, and a field added to the Go model would arrive in
// the shared type and nowhere else.
export type { Purchase };

export interface PurchasesPage {
  data: Purchase[];
  meta: { total: number; page: number; page_size: number; pages: number };
}

// Paginated, infinite-scroll list. Accumulates pages — call fetchNextPage()
// when the list reaches its end. Pass equality filters (e.g. a belongs_to
// foreign key) to scope the list: usePurchases("", { category_id: id }).
export function usePurchases(
  search = "",
  filters: Record<string, string> = {},
  sortBy = "created_at",
  sortOrder: "asc" | "desc" = "desc",
  pageSize = 20,
) {
  return useInfiniteQuery({
    queryKey: ["purchases", { search, filters, sortBy, sortOrder, pageSize }],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const qs = new URLSearchParams({
        page: String(pageParam),
        page_size: String(pageSize),
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (search) qs.set("search", search);
      for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v);
      return (await api.get("/purchases?" + qs.toString())) as PurchasesPage;
    },
    getNextPageParam: (last) =>
      last.meta.page < last.meta.pages ? last.meta.page + 1 : undefined,
  });
}

export function usePurchase(id: string) {
  return useQuery<Purchase>({
    queryKey: ["purchases", id],
    queryFn: async () => (await api.get("/purchases/" + id)).data,
    enabled: !!id,
  });
}

export function useCreatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => api.post("/purchases", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });
}

export function useUpdatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) =>
      api.put("/purchases/" + id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });
}

export function useDeletePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete("/purchases/" + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });
}
