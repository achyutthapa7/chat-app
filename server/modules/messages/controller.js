import { conversationModel } from "../conversation/model.js";
import { messageModel } from "./model.js";

export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    if (!message) return res.status(401).json("cannot send empty message");
    const newMessage = new messageModel({
      conversationId,
      message,
      senderId: req.user.id,
    });
    await newMessage.save();
    await conversationModel.findByIdAndUpdate(
      conversationId,
      {
        $push: {
          messages: newMessage._id,
        },
      },
      { new: true }
    );
    return res.status(201).json({
      success: true,
      data: newMessage,
      message: "message sent successfully",
    });
  } catch (error) {}
};

export const removeMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    await messageModel.findByIdAndDelete(messageId);
    await conversationModel.findOneAndUpdate(
      { messages: messageId },
      { $pull: { messages: messageId } }
    );

    return res.status(200).json("message is deleted successfully");
  } catch (error) {}
};
