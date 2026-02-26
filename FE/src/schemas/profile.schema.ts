import { z } from 'zod';

const vietnamesePhoneRegex = /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/;

export const candidateProfileSchema = z.object({
  fullName: z.string()
    .min(1, "Please enter full name!")
    .min(5, "Full name must be at least 5 characters!")
    .max(50, "Full name must not exceed 50 characters!"),
  phone: z.string()
    .min(1, "Please enter phone number!")
    .regex(vietnamesePhoneRegex, "Invalid phone number format!"),
  studentId: z.string()
    .min(1, "Please enter student ID!")
    .regex(/^[0-9]{8}$/, "Student ID must be exactly 8 digits!"),
  cohort: z.string()
    .min(1, "Please enter cohort!")
    .regex(/^[0-9]{4}$/, "Cohort must be a 4-digit year!"),
  major: z.string()
    .min(1, "Please enter major!")
    .min(2, "Major must be at least 2 characters!")
    .max(100, "Major must not exceed 100 characters!")
    .regex(/^[\p{L}0-9 .,&()\-]+$/u, "Major contains invalid characters!"),
});

export const companyProfileSchema = z.object({
  phone: z.string()
    .optional()
    .refine(
      (val) => !val || vietnamesePhoneRegex.test(val),
      { message: "Invalid phone number format!" }
    ),
});

export type CandidateProfileFormData = z.infer<typeof candidateProfileSchema>;
export type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;
