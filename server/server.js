const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on("connection", socket => {
  console.log(`New user connected: ${socket.id}`);

  socket.on("join-room", (roomID) => {
    console.log(`${socket.id} joining room: ${roomID}`);

    if (!rooms[roomID]) rooms[roomID] = [];

    rooms[roomID].push(socket.id);
    socket.join(roomID);

    const otherUsers = rooms[roomID].filter(id => id !== socket.id);
    socket.emit("all-users", otherUsers);
    console.log(`Users in room `, rooms[roomID].length);

    io.to(roomID).emit("room-user-count", rooms[roomID].length);

    socket.on("sending-signal", (payload) => {
      io.to(payload.userToSignal).emit("user-joined", {
        signal: payload.signal,
        callerID: socket.id,
      });
    });

    socket.on("returning-signal", (payload) => {
      io.to(payload.callerID).emit("receiving-returned-signal", {
        signal: payload.signal,
        id: socket.id,
      });
    });

    socket.on("disconnect", () => {
      console.log(`${socket.id} disconnected`);
      if (rooms[roomID]) {
        rooms[roomID] = rooms[roomID].filter(id => id !== socket.id);

        if (rooms[roomID].length === 0) {
          delete rooms[roomID];
        } else {
          io.to(roomID).emit("room-user-count", rooms[roomID].length);
        }
      }
    });
  });
});

server.listen(5000, () => console.log("Server running on http://localhost:5000"));
