import { Schema } from "mongoose";

export interface IIsEdited {
  isEdited: boolean;
}

/**
 * Reusable Mongoose plugin for edit-tracking.
 * Applied to: Review, InterviewExperience, ExperienceComment
 *
 * Adds:
 *   - isEdited: Boolean (default false) — set to true on any content update
 */
export const isEditedPlugin = (schema: Schema): void => {
  schema.add({
    isEdited: { type: Boolean, default: false },
  });
};
