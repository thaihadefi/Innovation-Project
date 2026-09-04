import mongoose from "mongoose";
import { ILocation } from "../interfaces/models/location.interface";

const schema = new mongoose.Schema<ILocation>(
  {
    name: String,
    slug: {
      type: String,
      unique: true
    }
  }
);

const Location = mongoose.model<ILocation>('Location', schema, "locations");

export default Location;