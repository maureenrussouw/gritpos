import type { Client } from "@repo/shared/types";
import type { CreateClientInput, UpdateClientInput } from "@repo/shared/schemas";
import { resourceHooks } from "./use-resource";

// React Query hooks for clients.
//
// The bodies live in ./use-resource.ts, so a fix to the hook shape, a new
// query parameter or a change to how the cache is invalidated reaches every
// resource in this project at once. Edit this file to change what THIS
// resource does; edit use-resource.ts to change what they all do.
const clients = resourceHooks<Client, CreateClientInput, UpdateClientInput>(
  "clients",
  "/api/clients",
);

export const useClients = clients.useList;
export const useGetClient = clients.useOne;
export const useCreateClient = clients.useCreate;
export const useUpdateClient = clients.useUpdate;
export const useDeleteClient = clients.useRemove;

/** The cache keys, for an invalidation this file does not already do. */
export const clientKeys = clients.keys;
