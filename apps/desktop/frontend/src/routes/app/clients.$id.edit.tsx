import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { ClientForm } from "@/components/resource-forms/clients-form";
import { useClient, useUpdateClient } from "@/hooks/use-clients";

export const Route = createFileRoute("/app/clients/$id/edit")({
  component: EditClientPage,
});

function EditClientPage() {
  const navigate = useNavigate();
  const { id } = useParams({ from: "/app/clients/$id/edit" });
  const { data: record, isLoading } = useClient(id);
  const update = useUpdateClient();

  if (isLoading) return <div className="text-[13px] text-foreground-muted">Loading…</div>;

  return (
    <div>
      <PageHeader title="Edit Client" description="Update this client" />
      <div className="mt-6">
        <ClientForm
          record={record}
          submitting={update.isPending}
          submitLabel="Save Changes"
          onSubmit={async (values) => {
            await update.mutateAsync({ id, data: values });
            navigate({ to: "/app/clients" });
          }}
        />
      </div>
    </div>
  );
}
