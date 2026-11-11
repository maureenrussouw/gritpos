import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { PurchaseForm } from "@/components/resource-forms/purchases-form";
import { useCreatePurchase } from "@/hooks/use-purchases";

export const Route = createFileRoute("/app/purchases/new")({
  component: NewPurchasePage,
});

function NewPurchasePage() {
  const navigate = useNavigate();
  const create = useCreatePurchase();

  return (
    <div>
      <PageHeader title="New Purchase" description="Create a new purchase" />
      <div className="mt-6">
        <PurchaseForm
          submitting={create.isPending}
          submitLabel="Create Purchase"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            navigate({ to: "/app/purchases" });
          }}
        />
      </div>
    </div>
  );
}
