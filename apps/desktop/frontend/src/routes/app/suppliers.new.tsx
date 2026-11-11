import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { SupplierForm } from "@/components/resource-forms/suppliers-form";
import { useCreateSupplier } from "@/hooks/use-suppliers";

export const Route = createFileRoute("/app/suppliers/new")({
  component: NewSupplierPage,
});

function NewSupplierPage() {
  const navigate = useNavigate();
  const create = useCreateSupplier();

  return (
    <div>
      <PageHeader title="New Supplier" description="Create a new supplier" />
      <div className="mt-6">
        <SupplierForm
          submitting={create.isPending}
          submitLabel="Create Supplier"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            navigate({ to: "/app/suppliers" });
          }}
        />
      </div>
    </div>
  );
}
