const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

// Hàm xử lý Socket.IO
const chatHandler = (io, socket) => {
  console.log('Chat handler initialized');
  // Cho phép client (admin hoặc user) join room. Hỗ trợ payload là string hoặc object.
socket.on('join_room', (payload) => {
  let roomId;
  if (typeof payload === 'string') {
    roomId = payload;
  } else if (payload && payload.roomId) {
    roomId = payload.roomId;
  }
  if (!roomId) return;
  socket.join(roomId);
  console.log(`🟡 Socket ${socket.id} joined room ${roomId}`);
});

  socket.on('close_room', async ({ roomId, closedBy }) => {
    try {
      // 1. Cập nhật trạng thái phòng
      await ChatRoom.updateOne(
        { roomId },
        { status: 'closed', updatedAt: new Date() }
      );
  
      // 2. Xóa toàn bộ tin nhắn thuộc roomId
      await Message.deleteMany({ roomId });
  
      // 3. Gửi thông báo tới tất cả clients trong room
      io.to(roomId).emit('room_closed', {
        closedBy,
        timestamp: new Date()
      });
  
      console.log(`✅ Đã đóng và xoá tất cả tin nhắn trong phòng ${roomId}`);
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
  });socket.on('send_message', async (data) => {
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
  
      const payload = {
        _id: newMessage._id,
        roomId,
        senderId,
        senderType,
        message,
        messageType,
        timestamp: newMessage.timestamp
      };
  
      if (senderType === 'admin') {
        // Admin đã tự hiển thị rồi, chỉ gửi cho người khác
        socket.to(roomId).emit('receive_message', payload);
      } else {
        io.to(roomId).emit('receive_message', payload);
      }
  
    } catch (error) {
      console.error('❌ Lỗi gửi tin nhắn:', error);
      socket.emit('error', { message: 'Không gửi được tin nhắn' });
    }
  });
  
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

  socket.on('mark_as_read', async ({ roomId }) => {
    try {
      if (!roomId) return;
      // Chỉ đánh dấu tin nhắn của user (chưa đọc) là đã đọc
      const result = await Message.updateMany(
        { roomId, senderType: 'user', isRead: false },
        { isRead: true }
      );
  
      // Thông báo lại cho admin (và có thể user khác nếu cần) số lượng đã đọc
      io.to(roomId).emit('messages_read', {
        roomId,
        updatedCount: result.modifiedCount || result.nModified || 0
      });
    } catch (err) {
      console.error('Lỗi mark_as_read:', err);
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