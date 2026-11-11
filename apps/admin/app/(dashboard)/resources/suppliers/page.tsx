"use client";

import { ResourcePage } from "@/components/resource/resource-page";
import { supplierResource } from "@/resources/suppliers/suppliers";

export default function SuppliersPage() {
  return <ResourcePage resource={supplierResource} />;
}
