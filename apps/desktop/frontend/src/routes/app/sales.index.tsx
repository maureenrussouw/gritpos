import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type DataColumn } from "@/components/tables/data-table";
import { ResourceDrawer } from "@/components/resource-drawer";
import { useConfirm } from "@/components/confirm-dialog";
import { SaleForm } from "@/components/resource-forms/sales-form";
import {
  useSales,
  useCreateSale,
  useUpdateSale,
  useDeleteSale,
  type Sale,
} from "@/hooks/use-sales";
import { useClients } from "@/hooks/use-clients";

export const Route = createFileRoute("/app/sales/")({
  component: SalesPage,
});

const COLUMNS: DataColumn[] = [
  { key: "client_label", label: "Client", format: "text" },
  { key: "total", label: "Total", format: "text" },
  { key: "discount", label: "Discount", format: "text" },
  { key: "payment_method", label: "Payment Method", format: "text" },
  { key: "amount_received", label: "Amount Received", format: "text" },
  { key: "items", label: "Items", format: "text" },
  { key: "created_at", label: "Created", format: "relative" },
];

const SEARCH_KEYS = ["payment_method", "items"];

function SalesPage() {
  const { data: items = [], isLoading } = useSales();
  const create = useCreateSale();
  const update = useUpdateSale();
  const del = useDeleteSale();
  const confirm = useConfirm();
  const [drawer, setDrawer] = useState<{ open: boolean; record: Sale | null }>({
    open: false,
    record: null,
  });

  const closeDrawer = () => setDrawer({ open: false, record: null });

  // Resolve belongs_to ids to the related record's name for the table.
  const clientMap = new Map((useClients().data ?? []).map((o: any) => [String(o.id), String(o.name ?? o.title ?? ([o.first_name, o.last_name].filter(Boolean).join(" ") || o.email || o.id))]));
  const rows = items.map((r) => ({ ...r, client_label: clientMap.get(String((r as any).client_id)) ?? "" }));

  return (
    <div>
      <PageHeader title="Sales" description="Manage your sales" />

      <div className="mt-6">
        <DataTable<Sale>
          title="Sales"
          singular="Sale"
          columns={COLUMNS}
          rows={rows}
          loading={isLoading}
          searchKeys={SEARCH_KEYS}
          onNew={() => setDrawer({ open: true, record: null })}
          onEdit={(row) => setDrawer({ open: true, record: row })}
          onDelete={async (row) => {
            if (await confirm({ title: "Delete sale", message: "This will delete this sale. This action cannot be undone.", danger: true, confirmLabel: "Delete" })) del.mutate(String(row.id));
          }}
          onBulkDelete={async (rows) => {
            if (await confirm({ title: "Delete sales", message: "Delete " + rows.length + " sale(s)? This cannot be undone.", danger: true, confirmLabel: "Delete" })) rows.forEach((r) => { del.mutate(String(r.id)); });
          }}
          onImport={(records) => records.forEach((rec) => { create.mutate(rec); })}
        />
      </div>

      <ResourceDrawer
        open={drawer.open}
        title={drawer.record ? "Edit Sale" : "New Sale"}
        description={drawer.record ? "Update this sale" : "Create a new sale"}
        onClose={closeDrawer}
      >
        <SaleForm
          record={drawer.record}
          submitting={create.isPending || update.isPending}
          submitLabel={drawer.record ? "Save changes" : "Create Sale"}
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
