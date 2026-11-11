import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Product, ProductInput } from "@/hooks/use-products";
import { NumberInput } from "@/components/number-input";
import { useCategories } from "@/hooks/use-categories";
import { SearchableSelect } from "@/components/searchable-select";
import { FileDropzone } from "@/components/file-dropzone";
import type { FileRef } from "@/lib/api-client";

const inputCls =
  "w-full rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-[13px] text-foreground placeholder:text-foreground-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";

interface ProductFormProps {
  // The typed resource, so passing the wrong record is a compile error rather
  // than a form that silently prefills nothing.
  record?: Product | null;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: ProductInput) => void | Promise<void>;
  onCancel?: () => void;
}

export function ProductForm({ record, submitting, submitLabel, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [categoryID, setCategoryID] = useState<string>("");
  const [thumbnail, setThumbnail] = useState<FileRef | null>(null);
  const [images, setImages] = useState<FileRef[]>([]);
  const categoriesOpts = useCategories().data ?? [];

  useEffect(() => {
    if (!record) return;
      setName(String(record.name ?? ""));
      setSku(String(record.sku ?? ""));
      setPrice(Number(record.price ?? 0));
      setStock(Number(record.stock ?? 0));
      setCategoryID(String(record.category_id ?? ""));
      setThumbnail((record.thumbnail as FileRef | null) ?? null);
      setImages((record.images as FileRef[]) ?? []);
  }, [record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name: name,
      sku: sku,
      price: price,
      stock: stock,
      category_id: categoryID,
      thumbnail: thumbnail as ProductInput["thumbnail"],
      images: images as ProductInput["images"],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">Sku</label>
          <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">Price</label>
          <NumberInput value={price} onChange={setPrice} kind="float" className={inputCls} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">Stock</label>
          <NumberInput value={stock} onChange={setStock} kind="int" className={inputCls} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">Category</label>
          <SearchableSelect value={categoryID} onChange={(v) => setCategoryID(v ?? "")} placeholder="Select category…"
            options={categoriesOpts.map((o: any) => ({ value: String(o.id), label: String(o.name ?? o.title ?? ([o.first_name, o.last_name].filter(Boolean).join(" ") || o.email || o.id)) }))} />
        </div>
        <FileDropzone label="Thumbnail" value={thumbnail} onChange={(v) => setThumbnail((v as FileRef) ?? null)} accept="image/*" />
        <FileDropzone label="Images" value={images} onChange={(v) => setImages((v as FileRef[]) ?? [])} multiple accept="image/*" />
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
