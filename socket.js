const socketIo = require('socket.io');
const { chatHandler } = require('./services/chatRoom.service'); // Destructuring

let io;

function initSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: ["http://localhost", "http://localhost:3000", "http://localhost:5000"],
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 New connection: ${socket.id}`);
    if (typeof chatHandler === 'function') {
      chatHandler(io, socket);
    } else {
      console.error('chatHandler is not a function');
    }
  });
}

module.exports = {
  initSocket,
  getIO: () => io
};