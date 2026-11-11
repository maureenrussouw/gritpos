"use client";

import { ResourcePage } from "@/components/resource/resource-page";
import { saleResource } from "@/resources/sales/sales";

export default function SalesPage() {
  return <ResourcePage resource={saleResource} />;
}
