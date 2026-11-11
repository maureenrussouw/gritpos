import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { ClientForm } from "@/components/resource-forms/clients-form";
import { useCreateClient } from "@/hooks/use-clients";

export const Route = createFileRoute("/app/clients/new")({
  component: NewClientPage,
});

function NewClientPage() {
  const navigate = useNavigate();
  const create = useCreateClient();

  return (
    <div>
      <PageHeader title="New Client" description="Create a new client" />
      <div className="mt-6">
        <ClientForm
          submitting={create.isPending}
          submitLabel="Create Client"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            navigate({ to: "/app/clients" });
          }}
        />
      </div>
    </div>
  );
}
