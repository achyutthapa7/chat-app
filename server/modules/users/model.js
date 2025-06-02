import mongoose from "mongoose";

const userShema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
    },
    password: {
      type: String,
    },
    conversations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "conversations",
      },
    ],
  },
  { timestamps: true }
);

export const userModel = new mongoose.model("users", userShema);
