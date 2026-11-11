import { defineResource } from "@/lib/resource";
import { CreatePurchaseSchema } from "@repo/shared/schemas";
import custom from "./purchases.custom";

export const purchaseResource = defineResource({
  name: "Purchase",
  slug: "purchases",
  endpoint: "/api/purchases",
  icon: "Database",
  label: { singular: "Purchase", plural: "Purchases" },
  table: {
    columns: [
      // grit:cols:auto-start
      { key: "supplier.name", label: "Supplier" },
      { key: "reference", label: "Reference", sortable: true, searchable: true, onClick: "link" },
      { key: "total", label: "Total", sortable: true },
      { key: "status", label: "Status", sortable: true, searchable: true },
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
    schema: CreatePurchaseSchema,
    fields: [
      // grit:fields:auto-start
    { key: "supplier_id", label: "Supplier", type: "relationship-select", required: true, relatedEndpoint: "/api/suppliers", displayField: "name" },
    { key: "reference", label: "Reference", type: "text", required: true },
    { key: "total", label: "Total", type: "number", numberKind: "float" },
    { key: "status", label: "Status", type: "text", required: true },
    { key: "items", label: "Items", type: "textarea" },
      // grit:fields:auto-end
    ],
  },
  dashboard: {
    widgets: [
      {
        type: "stat",
        label: "Total Purchases",
        endpoint: "/api/purchases",
        icon: "Database",
        color: "accent",
      },
    ],
  },
}, custom);
