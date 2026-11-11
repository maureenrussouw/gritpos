import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { SaleForm } from "@/components/resource-forms/sales-form";
import { useSale, useUpdateSale } from "@/hooks/use-sales";

export const Route = createFileRoute("/app/sales/$id/edit")({
  component: EditSalePage,
});

function EditSalePage() {
  const navigate = useNavigate();
  const { id } = useParams({ from: "/app/sales/$id/edit" });
  const { data: record, isLoading } = useSale(id);
  const update = useUpdateSale();

  if (isLoading) return <div className="text-[13px] text-foreground-muted">Loading…</div>;

  return (
    <div>
      <PageHeader title="Edit Sale" description="Update this sale" />
      <div className="mt-6">
        <SaleForm
          record={record}
          submitting={update.isPending}
          submitLabel="Save Changes"
          onSubmit={async (values) => {
            await update.mutateAsync({ id, data: values });
            navigate({ to: "/app/sales" });
          }}
        />
      </div>
    </div>
  );
}
