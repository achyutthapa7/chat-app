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

// const userToSocket = new Map();
// io.on("connection", (socket) => {
//   socket.on("join", (data) => {
//     io.emit("set-online", socket.id);
//     userToSocket.set(socket.id, data.username);
//   });
//   socket.on("join-room", (roomId) => {
//     socket.join(roomId);
//   });
//   socket.on("send-message", (data) => {
//     console.log("ds", data);
//     io.to(data.conversationId).emit("receive-message", data);
//   });
//   socket.on("send-indicator", ({ indicator, roomId }) => {
//     socket.broadcast.to(roomId).emit("receive-indicator", indicator);
//   });
//   socket.on("offline", (user) => {
//     console.log(`${user.name} went offline`);
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected unexpectedly");
//   });
// });

const userToSocket = new Map(); // Tracks user to socket mapping
const socketToUser = new Map(); // Tracks socket to user mapping

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // User joins the application
  socket.on("join", (userData) => {
    console.log(`${userData.username} joined with socket ${socket.id}`);
    userToSocket.set(userData._id, socket.id);
    socketToUser.set(socket.id, userData);
    io.emit("set-online", true);
  });

  // Join a conversation room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);
  });

  // Chat message handling
  socket.on("send-message", (data) => {
    io.to(data.conversationId).emit("receive-message", data);
    console.log(`Message sent in conversation ${data.conversationId}`);
  });

  // Typing indicator
  socket.on("typing", ({ conversationId, isTyping }) => {
    socket.broadcast
      .to(conversationId)
      .emit("receive-indicator", isTyping ? "typing..." : "");
  });

  // WebRTC Call Request
  socket.on("call-request", ({ offer, to, from, conversationId }) => {
    const recipientSocketId = userToSocket.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("incoming-call", {
        offer,
        from,
        conversationId,
      });
      console.log(`Call request from ${from.username} to ${to}`);
    } else {
      console.log(`Recipient ${to} not found`);
      // Notify caller that recipient is unavailable
      io.to(socket.id).emit("call-error", {
        message: "Recipient is not available",
      });
    }
  });

  // WebRTC Call Accepted
  socket.on("call-accepted", ({ answer, to, from, conversationId }) => {
    const callerSocketId = userToSocket.get(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-accepted", { answer });
      console.log(`Call accepted by ${from.username}`);
    }
  });

  // WebRTC ICE Candidate Exchange
  socket.on("ice-candidate", ({ candidate, to, conversationId }) => {
    const recipientSocketId = userToSocket.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("ice-candidate", { candidate });
    }
  });

  // WebRTC Call Ended
  socket.on("call-ended", ({ to, conversationId }) => {
    const recipientSocketId = userToSocket.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("call-ended");
      console.log(`Call ended in conversation ${conversationId}`);
    }
  });

  // User goes offline
  socket.on("offline", (userId) => {
    const userData = socketToUser.get(socket.id);
    if (userData) {
      console.log(`${userData.username} went offline`);
      userToSocket.delete(userId);
      io.emit("set-online", false);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const userData = socketToUser.get(socket.id);
    if (userData) {
      console.log(`${userData.username} disconnected`);
      userToSocket.delete(userData._id);
      io.emit("set-online", false);
    }
    socketToUser.delete(socket.id);
    console.log(`Client disconnected: ${socket.id}`);
  });
});
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
