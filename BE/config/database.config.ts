import mongoose from "mongoose";

export const connect = async () => {
  try {
    await mongoose.connect(`${process.env.DATABASE}`);
    console.log("Database connection successful!");
  } catch (error) {
    console.log(error);
    console.log("Database connection failed!");
  }
}