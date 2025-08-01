const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

exports.createOrGetRoom = async (req, res) => {
  const { userId } = req.body;
  let room = await ChatRoom.findOne({ userId, status: { $in: ['waiting', 'active'] } });

  if (!room) {
    room = new ChatRoom({ roomId: `room_${userId}_${Date.now()}`, userId });
    await room.save();
  }
  res.json({ success: true, room });
};

exports.getMessages = async (req, res) => {
  const messages = await Message.find({ roomId: req.params.roomId }).sort({ timestamp: 1 });
  res.json({ success: true, messages });
};
const { getIO } = require('../socket'); // lấy io để emit

exports.sendMessage = async (req, res) => {
  try {
    const { roomId, senderId, senderType, message, messageType = 'text' } = req.body;

    const newMessage = new Message({
      roomId,
      senderId,
      senderType,
      message,
      messageType
    });

    await newMessage.save();

    const io = getIO();
    io.to(roomId).emit('receive_message', {
      _id: newMessage._id,
      roomId,
      senderId,
      senderType,
      message,
      messageType,
      timestamp: newMessage.timestamp
    });

    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

