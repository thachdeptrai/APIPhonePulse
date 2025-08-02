const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  userId: String,
  adminId: { type: String, default: null },
  status: { type: String, enum: ['waiting', 'active', 'closed'], default: 'waiting' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
