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

// Indexes for query optimization
schema.index({ slug: 1 }); // Search by city slug (unique already creates index but explicit is clearer)

const City = mongoose.model('City', schema, "cities");

export default City;