const { Server } = require("socket.io");

let connection = {};
let messages = {};
let timeOnline = {};

const connectToSocket = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    socket.on("join-call", (path) => {
      if (connection[path] == undefined) {
        connection[path] = [];
      }
      connection[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      for (let i = 0; i < connection[path].length; i++) {
        io.to(connection[path][i]).emit(
          "user-joined",
          socket.id,
          connection[path]
        );
      }

      if (messages[path] != undefined) {
        for (let i = 0; i < messages[path].length; ++i) {
          io.to(socket.id).emit(
            "chat-message",
            messages[path][i]["data"],
            messages[path][i]["sender"],
            messages[path][i]["socket-id-sender"]
          );
        }
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const [machingRoom, found] = Object.entries(connection).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }
          return [room, isFound];
        },
        ["", false]
      );
      if (found == true) {
        if (messages[machingRoom] == undefined) {
          messages[machingRoom] = [];
        }
        messages[machingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });

        connection[machingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", sender, data, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {
      var difftime = Math.abs(timeOnline[socket.id] - new Date());
      console.log("User was online for:", difftime);

      var key;
      for (const [room, person] of Object.entries(connection)) {
        for (let i = 0; i < person.length; ++i) {
          if (person[i] == socket.id) {
            key = room;

            for (let i = 0; i < connection[key].length; ++i) {
              io.to(connection[key][i]).emit("user-left", socket.id);
            }

            var index = connection[key].indexOf(socket.id);

            connection[key].splice(index, 1);

            if (connection[key].length == 0) {
              delete connection[key];
            }
          }
        }
      }
    });
  });

  return io;
};

module.exports = connectToSocket;
