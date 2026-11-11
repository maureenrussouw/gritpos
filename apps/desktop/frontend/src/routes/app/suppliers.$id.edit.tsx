import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { SupplierForm } from "@/components/resource-forms/suppliers-form";
import { useSupplier, useUpdateSupplier } from "@/hooks/use-suppliers";

export const Route = createFileRoute("/app/suppliers/$id/edit")({
  component: EditSupplierPage,
});

function EditSupplierPage() {
  const navigate = useNavigate();
  const { id } = useParams({ from: "/app/suppliers/$id/edit" });
  const { data: record, isLoading } = useSupplier(id);
  const update = useUpdateSupplier();

  if (isLoading) return <div className="text-[13px] text-foreground-muted">Loading…</div>;

  return (
    <div>
      <PageHeader title="Edit Supplier" description="Update this supplier" />
      <div className="mt-6">
        <SupplierForm
          record={record}
          submitting={update.isPending}
          submitLabel="Save Changes"
          onSubmit={async (values) => {
            await update.mutateAsync({ id, data: values });
            navigate({ to: "/app/suppliers" });
          }}
        />
      </div>
    </div>
  );
}
