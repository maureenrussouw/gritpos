import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Client } from "@repo/shared/types";
import { localList, localGet, localCreate, localUpdate, localDelete } from "@/lib/sync-client";

// The offline store is generic over whatever it mirrors, so it hands back
// Record<string, unknown>. Asserting through unknown is what TypeScript wants
// for a widening cast between two types that do not overlap structurally, and
// it is honest: the rows really are unshaped until they get here.
//
// Casting once, here, is what lets the rest of the app see the same
// Client the API and every other client sees, and what makes grit sync
// reach this file: a locally declared type could not be updated.
export type { Client };

// What a create or an update may carry: the resource without the fields the
// server owns.
export type ClientInput = Partial<Omit<Client, "id" | "created_at" | "updated_at">>;

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => (await localList("clients")) as unknown as Client[],
    // The background sync loop keeps the local mirror fresh; re-read it so the
    // list reflects server changes without a manual refresh.
    refetchInterval: 3000,
  });
}

export function useClient(id: string) {
  return useQuery<Client | null>({
    queryKey: ["clients", id],
    queryFn: async () => (await localGet("clients", id)) as unknown as Client | null,
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClientInput) => localCreate("clients", "", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientInput }) =>
      localUpdate("clients", id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => localDelete("clients", id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}
