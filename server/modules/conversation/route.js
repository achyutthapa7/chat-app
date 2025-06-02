import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { createConversation, getConvo } from "./controllers.js";
const router = express.Router();

router.post("/create-conversation", authMiddleware, createConversation);
router.get("/get-conversation/:conversationId", authMiddleware, getConvo);

export { router };
