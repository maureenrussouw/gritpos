import type { Supplier } from "./supplier";

export interface Purchase {
  id: string;
  supplier_id: string;
  supplier?: Supplier;
  reference: string;
  total: number;
  status: string;
  items: string;
  version: number;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}
