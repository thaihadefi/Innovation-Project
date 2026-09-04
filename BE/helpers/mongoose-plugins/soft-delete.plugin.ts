import { Schema } from "mongoose";

export interface ISoftDelete {
  deleted: boolean;
}

export const softDeletePlugin = (schema: Schema): void => {
  schema.add({
    deleted: { type: Boolean, default: false },
  });
};
