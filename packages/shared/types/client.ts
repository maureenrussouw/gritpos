export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  version: number;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}
