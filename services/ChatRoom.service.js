const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

// Hàm xử lý Socket.IO
const chatHandler = (io, socket) => {
  console.log('Chat handler initialized');
  socket.on('close_room', async ({ roomId, closedBy }) => {
    try {
      // 1. Cập nhật trạng thái phòng
      await ChatRoom.updateOne(
        { roomId },
        { status: 'closed', updatedAt: new Date() }
      );
      // 2. Gửi thông báo tới tất cả clients trong room
      io.to(roomId).emit('room_closed', {
        closedBy,
        timestamp: new Date()
      });
  
      console.log(`✅ Đã đóng phòng ${roomId}`);
    } catch (error) {
      console.error('❌ Lỗi khi đóng phòng:', error);
      socket.emit('error', { message: 'Không thể đóng phòng' });
    }
  });
  // Xử lý sự kiện 'createRoom'
  socket.on('createRoom', async ({ userId }, callback) => {
    try {
      const room = await createOrGetRoom(userId);
      socket.join(room.roomId);
      io.emit('roomCreated', room);
      callback({ status: 'success', room });
    } catch (error) {
      callback({ status: 'error', message: error.message });
    }
  });
  socket.on('send_message', async (data) => {
    try {
        const { roomId, senderId, senderType, message, messageType = 'text' } = data;
  
        // Lưu vào MongoDB
        const newMessage = new Message({
            roomId,
            senderId,
            senderType,
            message,
            messageType
        });
  
        await newMessage.save();
  
        // Cập nhật room activity
        await ChatRoom.findOneAndUpdate(
            { roomId },
            { updatedAt: new Date() }
        );
  
        // Gửi lại cho tất cả client trong room
        io.to(roomId).emit('receive_message', {
            _id: newMessage._id,
            roomId,
            senderId,
            senderType,
            message,
            messageType,
            timestamp: newMessage.timestamp
        });
  
    } catch (error) {
        console.error('❌ Lỗi gửi tin nhắn:', error);
        socket.emit('error', { message: 'Không gửi được tin nhắn' });
    }
  });
  // Xử lý sự kiện 'assignAdmin'
  socket.on('assignAdmin', async ({ roomId, adminId }, callback) => {
    try {
      const room = await assignAdmin(roomId, adminId);
      if (!room) {
        return callback({ status: 'error', message: 'Room not found or not waiting' });
      }
      io.to(room.roomId).emit('adminAssigned', room);
      callback({ status: 'success', room });
    } catch (error) {
      callback({ status: 'error', message: error.message });
    }
  });

  // Xử lý ngắt kết nối
  socket.on('disconnect', () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
  });
};

const createOrGetRoom = async (userId) => {
  let room = await ChatRoom.findOne({ userId, status: { $in: ['waiting', 'active'] } });
  if (!room) {
    const roomId = `room_${userId}_${Date.now()}`;
    room = await ChatRoom.create({ userId, roomId });
  }
  return room;
};

const assignAdmin = async (roomId, adminId) => {
  return await ChatRoom.findOneAndUpdate(
    { roomId, status: 'waiting' },
    { adminId, status: 'active', updatedAt: new Date() },
    { new: true }
  );
};


module.exports = {
  createOrGetRoom,
  assignAdmin,
  chatHandler // Export hàm chatHandler
};