const mongoose = require('mongoose');

// Schema cho bảng Logs - lưu trữ nhật ký hoạt động của admin
const logSchema = new mongoose.Schema({
  // ID admin thực hiện hành động (tham chiếu đến collection Admin)
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  // Hành động mà admin đã thực hiện (ví dụ: "CREATE", "UPDATE", "DELETE", "LOGIN")
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT']
  },
  
  // Module/phần mà admin đã thao tác (ví dụ: "PRODUCT", "USER", "ORDER", "CATEGORY")
  module: {
    type: String,
    required: true,
    enum: ['PRODUCT', 'USER', 'ORDER', 'CATEGORY', 'ADMIN', 'STATS', 'SYSTEM']
  },
  
  // Thời gian thực hiện hành động
  time: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Chi tiết bổ sung về hành động (có thể chứa JSON string hoặc mô tả)
  details: {
    type: String,
    default: ''
  }
}, {
  // Tự động thêm createdAt và updatedAt
  timestamps: true
});

// Index để tối ưu hóa query theo adminId và time
logSchema.index({ adminId: 1, time: -1 });
logSchema.index({ module: 1, action: 1 });
logSchema.index({ time: -1 });

const Log = mongoose.model('Log', logSchema);

module.exports = Log;