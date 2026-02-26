import { z } from 'zod';

export const jobFormSchema = z.object({
  title: z.string()
    .min(1, "Please enter job title!")
    .min(5, "Job title must be at least 5 characters!")
    .max(200, "Job title must not exceed 200 characters!"),
  position: z.string().min(1, "Please select a level!"),
  workingForm: z.string().min(1, "Please select a working form!"),
  salaryMin: z.number().min(0, "Salary must be >= 0"),
  salaryMax: z.number().min(0, "Salary must be >= 0"),
  maxApplications: z.number().min(0),
  maxApproved: z.number().min(0),
}).refine((data) => data.salaryMax >= data.salaryMin, {
  message: "Maximum salary must be greater than or equal to minimum salary.",
  path: ["salaryMax"],
});

export type JobFormData = z.infer<typeof jobFormSchema>;
