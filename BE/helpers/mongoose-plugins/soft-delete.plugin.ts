import { Schema } from "mongoose";

export interface ISoftDelete {
  deleted: boolean;
}

/**
 * Reusable Mongoose plugin for soft-delete pattern.
 * Applied to: AccountCandidate, AccountCompany, AccountAdmin, Job, Role,
 *             Review, InterviewExperience, ExperienceComment
 *
 * Adds:
 *   - deleted: Boolean (default false) — never hard-delete, use updateOne({ deleted: true })
 *
 * Queries filtering active records must include { deleted: false }.
 */
export const softDeletePlugin = (schema: Schema): void => {
  schema.add({
    deleted: { type: Boolean, default: false },
  });
};
