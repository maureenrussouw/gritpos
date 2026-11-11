import type { Category } from "./category";
import type { FileRef } from "../schemas/file-ref";

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category_id: string;
  category?: Category;
  thumbnail: FileRef | null;
  images: FileRef[];
  version: number;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}
