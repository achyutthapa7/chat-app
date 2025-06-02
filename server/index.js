import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "./conn/conn.js";

connectDB();
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { router as authRoute } from "./modules/users/route.js";
import { router as messageRoute } from "./modules/messages/route.js";
import { router as conversationRoute } from "./modules/conversation/route.js";
import cookieParser from "cookie-parser";
const app = express();
import cors from "cors";
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["POST", "GET", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use("/api/user", authRoute);
app.use("/api/message", messageRoute);
app.use("/api/conversation", conversationRoute);

const userToSocket = new Map();
io.on("connection", (socket) => {
  socket.on("join", (data) => {
    io.emit("set-online", socket.id);
    userToSocket.set(socket.id, data.username);
  });
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
  });
  socket.on("send-message", (data) => {
    console.log("ds", data);
    io.to(data.conversationId).emit("receive-message", data);
  });
  socket.on("send-indicator", ({ indicator, roomId }) => {
    socket.broadcast.to(roomId).emit("receive-indicator", indicator);
  });
  socket.on("offline", (user) => {
    console.log(`${user.name} went offline`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected unexpectedly");
  });
});
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
