const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    type: { 
        type: String, 
        enum: ['broadcast', 'personalized'], 
        default: 'broadcast' 
    },
    createdAt: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ['pending','sent','failed'], 
        default: 'pending' 
    },

    // 🔥 Các field bổ sung (giống PHP)
    sent_count: { type: Number, default: 0 },
    failed_count: { type: Number, default: 0 },
    total_tokens: { type: Number, default: 0 },
    errors: { type: Array, default: [] }, // Lưu danh sách token lỗi
    sent_at: { type: Date },               // Thời điểm gửi xong
    error: { type: String }                // Lỗi tổng quát (nếu có)
});

module.exports = mongoose.model('Notification', NotificationSchema);
