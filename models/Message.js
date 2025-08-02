const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderType: { type: String, enum: ['user', 'admin'], required: true },
  message: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image'], default: 'text' },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema);
