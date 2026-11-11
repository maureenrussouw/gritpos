import { defineResource } from "@/lib/resource";
import { CreateSaleSchema } from "@repo/shared/schemas";
import custom from "./sales.custom";

export const saleResource = defineResource({
  name: "Sale",
  slug: "sales",
  endpoint: "/api/sales",
  icon: "Database",
  label: { singular: "Sale", plural: "Sales" },
  table: {
    columns: [
      // grit:cols:auto-start
      { key: "client.name", label: "Client" },
      { key: "total", label: "Total", sortable: true, onClick: "link" },
      { key: "discount", label: "Discount", sortable: true },
      { key: "payment_method", label: "Payment Method", sortable: true, searchable: true },
      { key: "amount_received", label: "Amount Received", sortable: true },
      { key: "items", label: "Items", searchable: true },
      { key: "created_at", label: "Created", sortable: true, format: "relative" },
      // grit:cols:auto-end
    ],
    filters: [
    ],
    defaultSort: { key: "created_at", direction: "desc" },
    searchable: true,
    pageSize: 20,
    // Shown once rows are ticked. Drop "archive" here and the Archived tab
    // goes with it; the model keeps its archived_at either way.
    bulkActions: ["edit", "archive", "restore", "export", "delete"],
  },
  form: {
    // The same schema the API validates the request against, so the form and
    // the server agree about what is required rather than agreeing by
    // coincidence because one generator wrote both sets of rules (grit#145).
    //
    // It is ANDed with the per-field rules below, not instead of them: those
    // know a rating's max and whether a conditional field is even visible,
    // and this knows a refinement that reads a sibling field.
    //
    // Remove it and the form falls back to the field rules alone, which is
    // what every form did before v3.475.0.
    schema: CreateSaleSchema,
    fields: [
      // grit:fields:auto-start
    { key: "client_id", label: "Client", type: "relationship-select", required: true, relatedEndpoint: "/api/clients", displayField: "name" },
    { key: "total", label: "Total", type: "number", numberKind: "float" },
    { key: "discount", label: "Discount", type: "number", numberKind: "float" },
    { key: "payment_method", label: "Payment Method", type: "text", required: true },
    { key: "amount_received", label: "Amount Received", type: "number", numberKind: "float" },
    { key: "items", label: "Items", type: "textarea" },
      // grit:fields:auto-end
    ],
  },
  dashboard: {
    widgets: [
      {
        type: "stat",
        label: "Total Sales",
        endpoint: "/api/sales",
        icon: "Database",
        color: "accent",
      },
    ],
  },
}, custom);
