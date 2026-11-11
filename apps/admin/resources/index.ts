import { usersResource } from "./users/users";
import { blogsResource } from "./blogs/blogs";
import { categoryResource } from "./categories/categories";
import { productResource } from "./products/products";
import { clientResource } from "./clients/clients";
import { supplierResource } from "./suppliers/suppliers";
import { purchaseResource } from "./purchases/purchases";
import { saleResource } from "./sales/sales";
// grit:resources

import type { ResourceDefinition } from "@/lib/resource";

export const resources: ResourceDefinition[] = [
  usersResource,
  blogsResource,
  categoryResource,
  productResource,
  clientResource,
  supplierResource,
  purchaseResource,
  saleResource,
  // grit:resource-list
];

export function getResource(slug: string): ResourceDefinition | undefined {
  return resources.find((r) => r.slug === slug);
}

export function getResourceByEndpoint(endpoint: string): ResourceDefinition | undefined {
  return resources.find((r) => r.endpoint === endpoint);
}
