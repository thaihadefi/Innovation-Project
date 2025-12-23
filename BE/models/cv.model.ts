import mongoose from "mongoose"; 

const schema = new mongoose.Schema(
  {
    jobId: String,
    fullName: String,
    email: String,
    phone: String,
    fileCV: String,
    viewed: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      default: "initial"
    }
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

const CV = mongoose.model('CV', schema, "cvs");

export default CV;