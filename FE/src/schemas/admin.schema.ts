import { z } from 'zod';
import { passwordSchema } from './auth.schema';

// ─── Role schemas ────────────────────────────────────────────────────────────

export const roleFormSchema = z.object({
  name: z.string()
    .min(1, "Please enter role name!")
    .min(2, "Role name must be at least 2 characters!")
    .max(50, "Role name must not exceed 50 characters!")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Role name can only contain letters, numbers, spaces, hyphens and underscores!"),
  description: z.string()
    .max(200, "Description must not exceed 200 characters!")
    .optional()
    .or(z.literal("")),
  permissions: z.array(z.string()),
});

export type RoleFormData = z.infer<typeof roleFormSchema>;

// ─── Admin Account schemas ───────────────────────────────────────────────────

export const adminAccountCreateSchema = z.object({
  fullName: z.string()
    .min(1, "Please enter full name!")
    .min(2, "Full name must be at least 2 characters!")
    .max(100, "Full name must not exceed 100 characters!"),
  email: z.string()
    .min(1, "Please enter email!")
    .email("Invalid email format!"),
  password: passwordSchema,
  phone: z.string()
    .regex(/^(\+?\d{9,15})?$/, "Invalid phone number format!")
    .optional()
    .or(z.literal("")),
  roleId: z.string().optional().or(z.literal("")),
});

export const adminAccountEditSchema = z.object({
  fullName: z.string()
    .min(1, "Please enter full name!")
    .min(2, "Full name must be at least 2 characters!")
    .max(100, "Full name must not exceed 100 characters!"),
  email: z.string()
    .min(1, "Please enter email!")
    .email("Invalid email format!"),
  password: z.union([
    z.literal(""),
    passwordSchema,
  ]).optional(),
  phone: z.string()
    .regex(/^(\+?\d{9,15})?$/, "Invalid phone number format!")
    .optional()
    .or(z.literal("")),
  roleId: z.string().optional().or(z.literal("")),
});

export type AdminAccountCreateFormData = z.infer<typeof adminAccountCreateSchema>;
export type AdminAccountEditFormData = z.infer<typeof adminAccountEditSchema>;
