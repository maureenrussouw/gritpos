export interface Supplier {
  id: string;
  name: string;
  phone: string;
  version: number;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}
