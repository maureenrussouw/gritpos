import { z } from "zod";

export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  version: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
  archived_at: z.string().nullable().optional(),
});

export const CreateSupplierSchema = z.object({
  name: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
});

export const UpdateSupplierSchema = z.object({
  name: z.string().min(1, "Required").optional(),
  phone: z.string().min(1, "Required").optional(),
});

export type Supplier = z.infer<typeof SupplierSchema>;
export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;
