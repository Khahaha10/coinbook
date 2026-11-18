import { z } from 'zod';
import { categoryTypeSchema, idSchema, nameSchema } from './common';

export const categoryIconSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use a lucide icon name, e.g. "utensils"')
  .max(40);

export const createCategorySchema = z
  .object({ name: nameSchema, type: categoryTypeSchema, icon: categoryIconSchema })
  .strict();
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z
  .object({ name: nameSchema, icon: categoryIconSchema })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const categorySchema = z.object({
  id: idSchema,
  name: z.string(),
  type: categoryTypeSchema,
  icon: z.string(),
  isDefault: z.boolean(),
});
export type CategoryDto = z.infer<typeof categorySchema>;
