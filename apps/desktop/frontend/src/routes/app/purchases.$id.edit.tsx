import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { PurchaseForm } from "@/components/resource-forms/purchases-form";
import { usePurchase, useUpdatePurchase } from "@/hooks/use-purchases";

export const Route = createFileRoute("/app/purchases/$id/edit")({
  component: EditPurchasePage,
});

function EditPurchasePage() {
  const navigate = useNavigate();
  const { id } = useParams({ from: "/app/purchases/$id/edit" });
  const { data: record, isLoading } = usePurchase(id);
  const update = useUpdatePurchase();

  if (isLoading) return <div className="text-[13px] text-foreground-muted">Loading…</div>;

  return (
    <div>
      <PageHeader title="Edit Purchase" description="Update this purchase" />
      <div className="mt-6">
        <PurchaseForm
          record={record}
          submitting={update.isPending}
          submitLabel="Save Changes"
          onSubmit={async (values) => {
            await update.mutateAsync({ id, data: values });
            navigate({ to: "/app/purchases" });
          }}
        />
      </div>
    </div>
  );
}
