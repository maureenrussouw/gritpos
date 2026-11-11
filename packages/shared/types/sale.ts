import type { Client } from "./client";

export interface Sale {
  id: string;
  client_id: string;
  client?: Client;
  total: number;
  discount: number;
  payment_method: string;
  amount_received: number;
  items: string;
  version: number;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}
