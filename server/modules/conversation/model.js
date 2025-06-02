import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    messages: [
      { type: mongoose.Schema.Types.ObjectId, ref: "messages", default: [] },
    ],
  },
  { timestamps: true }
);

export const conversationModel = new mongoose.model(
  "conversations",
  conversationSchema
);
