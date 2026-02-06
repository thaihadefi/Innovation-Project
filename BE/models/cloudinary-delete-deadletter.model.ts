import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    publicId: { type: String, default: "" },
    context: { type: String, default: "" },
    attempts: { type: Number, default: 0 },
    lastError: { type: String, default: "" },
    attemptsLog: { type: Array, default: [] },
  },
  {
    timestamps: true,
  }
);

const CloudinaryDeleteDeadletter = mongoose.model("CloudinaryDeleteDeadletter", schema, "cloudinary-delete-deadletters");

export default CloudinaryDeleteDeadletter;
