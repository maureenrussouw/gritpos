"use client";

import { use } from "react";
import { ResourceDetailPage } from "@/components/resource/resource-detail-page";
import { supplierResource } from "@/resources/suppliers/suppliers";

export default function SuppliersDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ResourceDetailPage resource={supplierResource} id={id} />;
}
