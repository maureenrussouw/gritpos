import type { Supplier } from "@repo/shared/types";
import type { CreateSupplierInput, UpdateSupplierInput } from "@repo/shared/schemas";
import { resourceHooks } from "./use-resource";

// React Query hooks for suppliers.
//
// The bodies live in ./use-resource.ts, so a fix to the hook shape, a new
// query parameter or a change to how the cache is invalidated reaches every
// resource in this project at once. Edit this file to change what THIS
// resource does; edit use-resource.ts to change what they all do.
const suppliers = resourceHooks<Supplier, CreateSupplierInput, UpdateSupplierInput>(
  "suppliers",
  "/api/suppliers",
);

export const useSuppliers = suppliers.useList;
export const useGetSupplier = suppliers.useOne;
export const useCreateSupplier = suppliers.useCreate;
export const useUpdateSupplier = suppliers.useUpdate;
export const useDeleteSupplier = suppliers.useRemove;

/** The cache keys, for an invalidation this file does not already do. */
export const supplierKeys = suppliers.keys;
