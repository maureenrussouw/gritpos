import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Supplier } from "@repo/shared/types";
import { localList, localGet, localCreate, localUpdate, localDelete } from "@/lib/sync-client";

// The offline store is generic over whatever it mirrors, so it hands back
// Record<string, unknown>. Asserting through unknown is what TypeScript wants
// for a widening cast between two types that do not overlap structurally, and
// it is honest: the rows really are unshaped until they get here.
//
// Casting once, here, is what lets the rest of the app see the same
// Supplier the API and every other client sees, and what makes grit sync
// reach this file: a locally declared type could not be updated.
export type { Supplier };

// What a create or an update may carry: the resource without the fields the
// server owns.
export type SupplierInput = Partial<Omit<Supplier, "id" | "created_at" | "updated_at">>;

export function useSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => (await localList("suppliers")) as unknown as Supplier[],
    // The background sync loop keeps the local mirror fresh; re-read it so the
    // list reflects server changes without a manual refresh.
    refetchInterval: 3000,
  });
}

export function useSupplier(id: string) {
  return useQuery<Supplier | null>({
    queryKey: ["suppliers", id],
    queryFn: async () => (await localGet("suppliers", id)) as unknown as Supplier | null,
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplierInput) => localCreate("suppliers", "", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SupplierInput }) =>
      localUpdate("suppliers", id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => localDelete("suppliers", id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}
