import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { SaleForm } from "@/components/resource-forms/sales-form";
import { useCreateSale } from "@/hooks/use-sales";

export const Route = createFileRoute("/app/sales/new")({
  component: NewSalePage,
});

function NewSalePage() {
  const navigate = useNavigate();
  const create = useCreateSale();

  return (
    <div>
      <PageHeader title="New Sale" description="Create a new sale" />
      <div className="mt-6">
        <SaleForm
          submitting={create.isPending}
          submitLabel="Create Sale"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            navigate({ to: "/app/sales" });
          }}
        />
      </div>
    </div>
  );
}
