const ChatRoom = require('../models/ChatRoom');

exports.getWaitingRooms = async (req, res) => {
  const rooms = await ChatRoom.find({ status: 'waiting' }).sort({ createdAt: -1 });
  res.json({ success: true, rooms });
};

exports.getActiveRooms = async (req, res) => {
  const { adminId } = req.params;
  const rooms = await ChatRoom.find({ adminId, status: 'active' }).sort({ updatedAt: -1 });
  res.json({ success: true, rooms });
};

exports.joinRoom = async (req, res) => {
  const { roomId, adminId } = req.body;
  const room = await ChatRoom.findOneAndUpdate(
    { roomId, status: 'waiting' },
    { adminId, status: 'active', updatedAt: new Date() },
    { new: true }
  );
  if (!room) return res.status(404).json({ success: false, message: 'Room not found or already taken' });
  res.json({ success: true, room });
};
