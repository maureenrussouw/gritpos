"use client";

import { ResourcePage } from "@/components/resource/resource-page";
import { clientResource } from "@/resources/clients/clients";

export default function ClientsPage() {
  return <ResourcePage resource={clientResource} />;
}
