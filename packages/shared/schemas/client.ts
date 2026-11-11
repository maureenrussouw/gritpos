import { z } from "zod";

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  email: z.string().min(1, "Required"),
  version: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
  archived_at: z.string().nullable().optional(),
});

export const CreateClientSchema = z.object({
  name: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  email: z.string().min(1, "Required"),
});

export const UpdateClientSchema = z.object({
  name: z.string().min(1, "Required").optional(),
  phone: z.string().min(1, "Required").optional(),
  email: z.string().min(1, "Required").optional(),
});

export type Client = z.infer<typeof ClientSchema>;
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
