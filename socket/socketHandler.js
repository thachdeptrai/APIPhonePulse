const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('join_room', async ({ roomId, userId, userType }) => {
      socket.join(roomId);
      await ChatRoom.updateOne({ roomId }, { updatedAt: new Date() });
      socket.to(roomId).emit('user_joined', { userId, userType });
    });

    socket.on('send_message', async ({ roomId, senderId, senderType, message, messageType = 'text' }) => {
      const msg = new Message({ roomId, senderId, senderType, message, messageType });
      await msg.save();
      await ChatRoom.updateOne({ roomId }, { updatedAt: new Date() });
      io.to(roomId).emit('receive_message', { ...msg._doc });
    });

    socket.on('typing', ({ roomId, userId, userType, isTyping }) => {
      socket.to(roomId).emit('user_typing', { userId, userType, isTyping });
    });

    socket.on('close_room', async ({ roomId, closedBy }) => {
      await ChatRoom.updateOne({ roomId }, { status: 'closed', updatedAt: new Date() });
      io.to(roomId).emit('room_closed', { closedBy, timestamp: new Date() });
    });
  });
};
