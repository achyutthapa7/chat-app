import express from "express";
import { removeMessage, sendMessage } from "./controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
const router = express.Router();
router.post("/send-message/:conversationId", authMiddleware, sendMessage);
router.delete("/delete-message/:messageId", removeMessage);
export { router };
