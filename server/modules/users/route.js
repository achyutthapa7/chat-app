import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

import * as authController from "./controller.js";
const router = express.Router();
router.post("/register", authController.register);
router.post("/create-password/:username", authController.createPassword);
router.post("/login", authController.login);
router.get("/get-users", authMiddleware, authController.getUsers);
router.get("/get-me", authMiddleware, authController.getMe);
export { router };
