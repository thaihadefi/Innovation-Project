import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: String,
    slug: {
      type: String,
      unique: true
    }
  }
);

const City = mongoose.model('City', schema, "cities");

export default City;