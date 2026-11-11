import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Purchase } from "@repo/shared/types";
import { localList, localGet, localCreate, localUpdate, localDelete } from "@/lib/sync-client";

// The offline store is generic over whatever it mirrors, so it hands back
// Record<string, unknown>. Asserting through unknown is what TypeScript wants
// for a widening cast between two types that do not overlap structurally, and
// it is honest: the rows really are unshaped until they get here.
//
// Casting once, here, is what lets the rest of the app see the same
// Purchase the API and every other client sees, and what makes grit sync
// reach this file: a locally declared type could not be updated.
export type { Purchase };

// What a create or an update may carry: the resource without the fields the
// server owns.
export type PurchaseInput = Partial<Omit<Purchase, "id" | "created_at" | "updated_at">>;

export function usePurchases() {
  return useQuery<Purchase[]>({
    queryKey: ["purchases"],
    queryFn: async () => (await localList("purchases")) as unknown as Purchase[],
    // The background sync loop keeps the local mirror fresh; re-read it so the
    // list reflects server changes without a manual refresh.
    refetchInterval: 3000,
  });
}

export function usePurchase(id: string) {
  return useQuery<Purchase | null>({
    queryKey: ["purchases", id],
    queryFn: async () => (await localGet("purchases", id)) as unknown as Purchase | null,
    enabled: !!id,
  });
}

export function useCreatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PurchaseInput) => localCreate("purchases", "", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });
}

export function useUpdatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PurchaseInput }) =>
      localUpdate("purchases", id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });
}

export function useDeletePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => localDelete("purchases", id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });
}
