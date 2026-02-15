import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: String,
    slug: {
      type: String,
      unique: true // unique: true automatically creates an index
    }
  }
);

const Location = mongoose.model('Location', schema, "locations");

export default Location;