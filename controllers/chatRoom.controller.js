const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const axios = require('axios');

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
// Chat AI tư vấn

exports.askAI = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Thiếu nội dung câu hỏi' });

    // Gọi OpenAI API (hoặc dịch vụ AI khác)
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // hoặc gpt-4 nếu có
        messages: [{ role: 'user', content: message }],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiReply = response.data.choices[0].message.content;
    res.json({ reply: aiReply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
