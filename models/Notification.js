// models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    type: { type: String, enum: ['broadcast', 'personalized'], default: 'broadcast' },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending','sent','failed'], default: 'pending' }
});

module.exports = mongoose.model('Notification', NotificationSchema);
