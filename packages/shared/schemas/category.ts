import { z } from "zod";
import { FileRefSchema } from "./file-ref";

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Required"),
  slug: z.string(),
  image: FileRefSchema.nullable(),
  version: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
  archived_at: z.string().nullable().optional(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Required"),
  image: FileRefSchema.nullable().optional(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1, "Required").optional(),
  image: FileRefSchema.nullable().optional(),
});

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
