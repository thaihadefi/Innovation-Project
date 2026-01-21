import mongoose from "mongoose";

export const connect = async () => {
  try {
    await mongoose.connect(`${process.env.DATABASE}`, {
      // Connection pool settings for performance
      maxPoolSize: 10,      // Maximum connections in pool (default: 5)
      minPoolSize: 2,       // Keep minimum connections ready
      socketTimeoutMS: 45000,     // Socket timeout
      serverSelectionTimeoutMS: 5000, // Server selection timeout
    });
    console.log("Database connection successful!");
  } catch (error) {
    console.log(error);
    console.log("Database connection failed!");
  }
}