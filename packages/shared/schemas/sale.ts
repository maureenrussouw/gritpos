import { z } from "zod";

export const SaleSchema = z.object({
  id: z.string(),
  client_id: z.string().uuid("Invalid ID"),
  client: z.unknown().optional(),
  total: z.number(),
  discount: z.number(),
  payment_method: z.string().min(1, "Required"),
  amount_received: z.number(),
  items: z.string(),
  version: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
  archived_at: z.string().nullable().optional(),
});

export const CreateSaleSchema = z.object({
  client_id: z.string().uuid("Invalid ID"),
  total: z.number().optional(),
  discount: z.number().optional(),
  payment_method: z.string().min(1, "Required"),
  amount_received: z.number().optional(),
  items: z.string().optional(),
});

export const UpdateSaleSchema = z.object({
  client_id: z.string().uuid("Invalid ID").optional(),
  total: z.number().optional(),
  discount: z.number().optional(),
  payment_method: z.string().min(1, "Required").optional(),
  amount_received: z.number().optional(),
  items: z.string().optional(),
});

export type Sale = z.infer<typeof SaleSchema>;
export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;
export type UpdateSaleInput = z.infer<typeof UpdateSaleSchema>;
