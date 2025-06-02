import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

const mongoURI = process.env.mongo_uri;

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {});
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export { connectDB };
