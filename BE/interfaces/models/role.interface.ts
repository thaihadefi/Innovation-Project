import { Types, Document } from "mongoose";
import { ISoftDelete } from "../../helpers/mongoose-plugins/soft-delete.plugin";

export interface IRole extends Document, ISoftDelete {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}
