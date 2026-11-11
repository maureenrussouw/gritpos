import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Category } from "@repo/shared/types";
import type { FileRef } from "@repo/shared/schemas";
import { api } from "@/lib/api";

// Re-exported because the generated screens import it from here. The
// definition itself lives in packages/shared, so grit sync reaches it: a local
// copy could not be updated, and a field added to the Go model would arrive in
// the shared type and nowhere else.
export type { Category };

export interface CategoriesPage {
  data: Category[];
  meta: { total: number; page: number; page_size: number; pages: number };
}

// Paginated, infinite-scroll list. Accumulates pages — call fetchNextPage()
// when the list reaches its end. Pass equality filters (e.g. a belongs_to
// foreign key) to scope the list: useCategories("", { category_id: id }).
export function useCategories(
  search = "",
  filters: Record<string, string> = {},
  sortBy = "created_at",
  sortOrder: "asc" | "desc" = "desc",
  pageSize = 20,
) {
  return useInfiniteQuery({
    queryKey: ["categories", { search, filters, sortBy, sortOrder, pageSize }],
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
      return (await api.get("/categories?" + qs.toString())) as CategoriesPage;
    },
    getNextPageParam: (last) =>
      last.meta.page < last.meta.pages ? last.meta.page + 1 : undefined,
  });
}

export function useCategory(id: string) {
  return useQuery<Category>({
    queryKey: ["categories", id],
    queryFn: async () => (await api.get("/categories/" + id)).data,
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => api.post("/categories", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) =>
      api.put("/categories/" + id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete("/categories/" + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
