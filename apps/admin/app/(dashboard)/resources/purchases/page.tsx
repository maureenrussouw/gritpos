"use client";

import { ResourcePage } from "@/components/resource/resource-page";
import { purchaseResource } from "@/resources/purchases/purchases";

export default function PurchasesPage() {
  return <ResourcePage resource={purchaseResource} />;
}
