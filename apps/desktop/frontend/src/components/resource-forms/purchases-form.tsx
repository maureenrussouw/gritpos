import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Purchase, PurchaseInput } from "@/hooks/use-purchases";
import { useSuppliers } from "@/hooks/use-suppliers";
import { SearchableSelect } from "@/components/searchable-select";
import { NumberInput } from "@/components/number-input";

const inputCls =
  "w-full rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-[13px] text-foreground placeholder:text-foreground-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";

interface PurchaseFormProps {
  // The typed resource, so passing the wrong record is a compile error rather
  // than a form that silently prefills nothing.
  record?: Purchase | null;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: PurchaseInput) => void | Promise<void>;
  onCancel?: () => void;
}

export function PurchaseForm({ record, submitting, submitLabel, onSubmit, onCancel }: PurchaseFormProps) {
  const [supplierID, setSupplierID] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [total, setTotal] = useState<number>(0);
  const [status, setStatus] = useState<string>("");
  const [items, setItems] = useState<string>("");
  const suppliersOpts = useSuppliers().data ?? [];

  useEffect(() => {
    if (!record) return;
      setSupplierID(String(record.supplier_id ?? ""));
      setReference(String(record.reference ?? ""));
      setTotal(Number(record.total ?? 0));
      setStatus(String(record.status ?? ""));
      setItems(String(record.items ?? ""));
  }, [record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      supplier_id: supplierID,
      reference: reference,
      total: total,
      status: status,
      items: items,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">Supplier</label>
          <SearchableSelect value={supplierID} onChange={(v) => setSupplierID(v ?? "")} placeholder="Select supplier…"
            options={suppliersOpts.map((o: any) => ({ value: String(o.id), label: String(o.name ?? o.title ?? ([o.first_name, o.last_name].filter(Boolean).join(" ") || o.email || o.id)) }))} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">Reference</label>
          <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">Total</label>
          <NumberInput value={total} onChange={setTotal} kind="float" className={inputCls} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">Status</label>
          <input type="text" value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">Items</label>
          <textarea value={items} onChange={(e) => setItems(e.target.value)} rows={4} className={inputCls} />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-foreground-secondary transition-colors hover:bg-surface-hover"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
