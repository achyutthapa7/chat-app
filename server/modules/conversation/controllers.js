import { userModel } from "../users/model.js";
import { conversationModel } from "./model.js";

export const createConversation = async (req, res) => {
  try {
    const { recepientIds } = req.body;
    const { id } = req.user;

    if (
      !recepientIds ||
      !Array.isArray(recepientIds) ||
      recepientIds.length === 0
    ) {
      return res.status(400).json({ message: "Invalid recipient IDs" });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const participantsIds = [...recepientIds, id];
    const existing = await conversationModel.findOne({
      participants: { $all: participantsIds, $size: participantsIds.length },
    });

    if (existing) {
      return res.status(200).json({
        message: "Conversation already exists",
        data: existing,
      });
    }

    const newConversation = new conversationModel({
      participants: participantsIds,
    });

    for (const participant of participantsIds) {
      await userModel.findByIdAndUpdate(participant, {
        $push: { conversations: newConversation._id },
      });
    }

    const saved = await newConversation.save();
    return res.status(201).json({
      message: "Conversation created successfully",
      data: saved,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
export const getConvo = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await conversationModel
      .findById(conversationId)
      .populate("messages");
    return res.status(200).json({ data: conversation });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
