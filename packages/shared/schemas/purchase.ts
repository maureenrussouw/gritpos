import { z } from "zod";

export const PurchaseSchema = z.object({
  id: z.string(),
  supplier_id: z.string().uuid("Invalid ID"),
  supplier: z.unknown().optional(),
  reference: z.string().min(1, "Required"),
  total: z.number(),
  status: z.string().min(1, "Required"),
  items: z.string(),
  version: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
  archived_at: z.string().nullable().optional(),
});

export const CreatePurchaseSchema = z.object({
  supplier_id: z.string().uuid("Invalid ID"),
  reference: z.string().min(1, "Required"),
  total: z.number().optional(),
  status: z.string().min(1, "Required"),
  items: z.string().optional(),
});

export const UpdatePurchaseSchema = z.object({
  supplier_id: z.string().uuid("Invalid ID").optional(),
  reference: z.string().min(1, "Required").optional(),
  total: z.number().optional(),
  status: z.string().min(1, "Required").optional(),
  items: z.string().optional(),
});

export type Purchase = z.infer<typeof PurchaseSchema>;
export type CreatePurchaseInput = z.infer<typeof CreatePurchaseSchema>;
export type UpdatePurchaseInput = z.infer<typeof UpdatePurchaseSchema>;
