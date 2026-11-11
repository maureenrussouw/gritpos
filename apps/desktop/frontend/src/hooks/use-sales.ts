import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Sale } from "@repo/shared/types";
import { localList, localGet, localCreate, localUpdate, localDelete } from "@/lib/sync-client";

// The offline store is generic over whatever it mirrors, so it hands back
// Record<string, unknown>. Asserting through unknown is what TypeScript wants
// for a widening cast between two types that do not overlap structurally, and
// it is honest: the rows really are unshaped until they get here.
//
// Casting once, here, is what lets the rest of the app see the same
// Sale the API and every other client sees, and what makes grit sync
// reach this file: a locally declared type could not be updated.
export type { Sale };

// What a create or an update may carry: the resource without the fields the
// server owns.
export type SaleInput = Partial<Omit<Sale, "id" | "created_at" | "updated_at">>;

export function useSales() {
  return useQuery<Sale[]>({
    queryKey: ["sales"],
    queryFn: async () => (await localList("sales")) as unknown as Sale[],
    // The background sync loop keeps the local mirror fresh; re-read it so the
    // list reflects server changes without a manual refresh.
    refetchInterval: 3000,
  });
}

export function useSale(id: string) {
  return useQuery<Sale | null>({
    queryKey: ["sales", id],
    queryFn: async () => (await localGet("sales", id)) as unknown as Sale | null,
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SaleInput) => localCreate("sales", "", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales"] }),
  });
}

export function useUpdateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SaleInput }) =>
      localUpdate("sales", id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales"] }),
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => localDelete("sales", id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales"] }),
  });
}
