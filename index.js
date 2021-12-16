const express = require("express");
const app = express();
const socket = require("socket.io");

const port = process.env.PORT || 3000;

app.use(express.static("public"));

let server = app.listen(port, () => {
  console.log(`server in running on ${port}`);
});
let io = socket(server);

io.on("connection", (socket) => {
  console.log(`user connected ${socket.id}`);
  var rooms = io.sockets.adapter.rooms; // geting all rooms
  socket.on("join", (roomName) => {
    console.log("Room Name:", roomName);

    var room = rooms.get(roomName); // finding spacfic room

    if (room === undefined) {
      // if room is not found then room is created
      socket.join(roomName);
      socket.emit("created");
      return;
    } else if (room.size === 1) {
      // if user join the room when  room size is 1
      socket.join(roomName);
      socket.emit("joined");
      return;
    } else {
      socket.emit("full");
    }

    console.log(rooms);
    return;
  });
  socket.on("ready", (roomName) => {
    console.log("ready");
    socket.broadcast.to(roomName).emit("ready");
  });
  socket.on("candidate", (candidate, roomName) => {
    socket.broadcast.to(roomName).emit("candidate", candidate);
  });
  socket.on("offer", (offer, roomName) => {
    console.log("offer");
    console.log(offer);
    socket.broadcast.to(roomName).emit("offer", offer);
  });
  socket.on("answer", (answer, roomName) => {
    console.log("answer");
    socket.broadcast.to(roomName).emit("answer", answer);
  });
});
