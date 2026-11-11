import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Supplier } from "@repo/shared/types";
import { api } from "@/lib/api";

// Re-exported because the generated screens import it from here. The
// definition itself lives in packages/shared, so grit sync reaches it: a local
// copy could not be updated, and a field added to the Go model would arrive in
// the shared type and nowhere else.
export type { Supplier };

export interface SuppliersPage {
  data: Supplier[];
  meta: { total: number; page: number; page_size: number; pages: number };
}

// Paginated, infinite-scroll list. Accumulates pages — call fetchNextPage()
// when the list reaches its end. Pass equality filters (e.g. a belongs_to
// foreign key) to scope the list: useSuppliers("", { category_id: id }).
export function useSuppliers(
  search = "",
  filters: Record<string, string> = {},
  sortBy = "created_at",
  sortOrder: "asc" | "desc" = "desc",
  pageSize = 20,
) {
  return useInfiniteQuery({
    queryKey: ["suppliers", { search, filters, sortBy, sortOrder, pageSize }],
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
      return (await api.get("/suppliers?" + qs.toString())) as SuppliersPage;
    },
    getNextPageParam: (last) =>
      last.meta.page < last.meta.pages ? last.meta.page + 1 : undefined,
  });
}

export function useSupplier(id: string) {
  return useQuery<Supplier>({
    queryKey: ["suppliers", id],
    queryFn: async () => (await api.get("/suppliers/" + id)).data,
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => api.post("/suppliers", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) =>
      api.put("/suppliers/" + id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete("/suppliers/" + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}
