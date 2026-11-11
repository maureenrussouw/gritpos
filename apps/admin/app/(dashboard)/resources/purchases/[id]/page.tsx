"use client";

import { use } from "react";
import { ResourceDetailPage } from "@/components/resource/resource-detail-page";
import { purchaseResource } from "@/resources/purchases/purchases";

export default function PurchasesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ResourceDetailPage resource={purchaseResource} id={id} />;
}
