import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type DataColumn } from "@/components/tables/data-table";
import { ResourceDrawer } from "@/components/resource-drawer";
import { useConfirm } from "@/components/confirm-dialog";
import { PurchaseForm } from "@/components/resource-forms/purchases-form";
import {
  usePurchases,
  useCreatePurchase,
  useUpdatePurchase,
  useDeletePurchase,
  type Purchase,
} from "@/hooks/use-purchases";
import { useSuppliers } from "@/hooks/use-suppliers";

export const Route = createFileRoute("/app/purchases/")({
  component: PurchasesPage,
});

const COLUMNS: DataColumn[] = [
  { key: "supplier_label", label: "Supplier", format: "text" },
  { key: "reference", label: "Reference", format: "text" },
  { key: "total", label: "Total", format: "text" },
  { key: "status", label: "Status", format: "text" },
  { key: "items", label: "Items", format: "text" },
  { key: "created_at", label: "Created", format: "relative" },
];

const SEARCH_KEYS = ["reference", "status", "items"];

function PurchasesPage() {
  const { data: items = [], isLoading } = usePurchases();
  const create = useCreatePurchase();
  const update = useUpdatePurchase();
  const del = useDeletePurchase();
  const confirm = useConfirm();
  const [drawer, setDrawer] = useState<{ open: boolean; record: Purchase | null }>({
    open: false,
    record: null,
  });

  const closeDrawer = () => setDrawer({ open: false, record: null });

  // Resolve belongs_to ids to the related record's name for the table.
  const supplierMap = new Map((useSuppliers().data ?? []).map((o: any) => [String(o.id), String(o.name ?? o.title ?? ([o.first_name, o.last_name].filter(Boolean).join(" ") || o.email || o.id))]));
  const rows = items.map((r) => ({ ...r, supplier_label: supplierMap.get(String((r as any).supplier_id)) ?? "" }));

  return (
    <div>
      <PageHeader title="Purchases" description="Manage your purchases" />

      <div className="mt-6">
        <DataTable<Purchase>
          title="Purchases"
          singular="Purchase"
          columns={COLUMNS}
          rows={rows}
          loading={isLoading}
          searchKeys={SEARCH_KEYS}
          onNew={() => setDrawer({ open: true, record: null })}
          onEdit={(row) => setDrawer({ open: true, record: row })}
          onDelete={async (row) => {
            if (await confirm({ title: "Delete purchase", message: "This will delete this purchase. This action cannot be undone.", danger: true, confirmLabel: "Delete" })) del.mutate(String(row.id));
          }}
          onBulkDelete={async (rows) => {
            if (await confirm({ title: "Delete purchases", message: "Delete " + rows.length + " purchase(s)? This cannot be undone.", danger: true, confirmLabel: "Delete" })) rows.forEach((r) => { del.mutate(String(r.id)); });
          }}
          onImport={(records) => records.forEach((rec) => { create.mutate(rec); })}
        />
      </div>

      <ResourceDrawer
        open={drawer.open}
        title={drawer.record ? "Edit Purchase" : "New Purchase"}
        description={drawer.record ? "Update this purchase" : "Create a new purchase"}
        onClose={closeDrawer}
      >
        <PurchaseForm
          record={drawer.record}
          submitting={create.isPending || update.isPending}
          submitLabel={drawer.record ? "Save changes" : "Create Purchase"}
          onCancel={closeDrawer}
          onSubmit={async (values) => {
            if (drawer.record) {
              await update.mutateAsync({ id: String(drawer.record.id), data: values });
            } else {
              await create.mutateAsync(values);
            }
            closeDrawer();
          }}
        />
      </ResourceDrawer>
    </div>
  );
}
