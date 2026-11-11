import type { FileRef } from "../schemas/file-ref";

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: FileRef | null;
  version: number;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}
