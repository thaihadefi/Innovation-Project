import { Schema } from "mongoose";

export interface IIsEdited {
  isEdited: boolean;
}

export const isEditedPlugin = (schema: Schema): void => {
  schema.add({
    isEdited: { type: Boolean, default: false },
  });
};
