import type { Purchase } from "@repo/shared/types";
import type { CreatePurchaseInput, UpdatePurchaseInput } from "@repo/shared/schemas";
import { resourceHooks } from "./use-resource";

// React Query hooks for purchases.
//
// The bodies live in ./use-resource.ts, so a fix to the hook shape, a new
// query parameter or a change to how the cache is invalidated reaches every
// resource in this project at once. Edit this file to change what THIS
// resource does; edit use-resource.ts to change what they all do.
const purchases = resourceHooks<Purchase, CreatePurchaseInput, UpdatePurchaseInput>(
  "purchases",
  "/api/purchases",
);

export const usePurchases = purchases.useList;
export const useGetPurchase = purchases.useOne;
export const useCreatePurchase = purchases.useCreate;
export const useUpdatePurchase = purchases.useUpdate;
export const useDeletePurchase = purchases.useRemove;

/** The cache keys, for an invalidation this file does not already do. */
export const purchaseKeys = purchases.keys;
