import { Types, Document } from "mongoose";

export interface ILocation extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}
