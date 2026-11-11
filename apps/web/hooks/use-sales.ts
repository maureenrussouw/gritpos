import type { Sale } from "@repo/shared/types";
import type { CreateSaleInput, UpdateSaleInput } from "@repo/shared/schemas";
import { resourceHooks } from "./use-resource";

// React Query hooks for sales.
//
// The bodies live in ./use-resource.ts, so a fix to the hook shape, a new
// query parameter or a change to how the cache is invalidated reaches every
// resource in this project at once. Edit this file to change what THIS
// resource does; edit use-resource.ts to change what they all do.
const sales = resourceHooks<Sale, CreateSaleInput, UpdateSaleInput>(
  "sales",
  "/api/sales",
);

export const useSales = sales.useList;
export const useGetSale = sales.useOne;
export const useCreateSale = sales.useCreate;
export const useUpdateSale = sales.useUpdate;
export const useDeleteSale = sales.useRemove;

/** The cache keys, for an invalidation this file does not already do. */
export const saleKeys = sales.keys;
