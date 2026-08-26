import mongoose from "mongoose";

export const connect = async () => {
  try {
    mongoose.set("bufferCommands", false);

    await mongoose.connect(`${process.env.DATABASE}`, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log("Database connection successful!");
  } catch (error) {
    console.log(error);
    console.log("Database connection failed!");
    throw error;
  }
}
