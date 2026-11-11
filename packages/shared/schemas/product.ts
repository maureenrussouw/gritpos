import { z } from "zod";
import { FileRefSchema } from "./file-ref";

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Required"),
  sku: z.string().min(1, "Required"),
  price: z.number(),
  stock: z.number().int(),
  category_id: z.string().uuid("Invalid ID"),
  category: z.unknown().optional(),
  thumbnail: FileRefSchema.nullable(),
  images: z.array(FileRefSchema).default([]),
  version: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
  archived_at: z.string().nullable().optional(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1, "Required"),
  sku: z.string().min(1, "Required"),
  price: z.number().optional(),
  stock: z.number().int().optional(),
  category_id: z.string().uuid("Invalid ID"),
  thumbnail: FileRefSchema.nullable().optional(),
  images: z.array(FileRefSchema).default([]),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1, "Required").optional(),
  sku: z.string().min(1, "Required").optional(),
  price: z.number().optional(),
  stock: z.number().int().optional(),
  category_id: z.string().uuid("Invalid ID").optional(),
  thumbnail: FileRefSchema.nullable().optional(),
  images: z.array(FileRefSchema).default([]).optional(),
});

export type Product = z.infer<typeof ProductSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
