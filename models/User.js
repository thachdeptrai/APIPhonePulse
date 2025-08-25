const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        // Tên người dùng
        required: true,
    },
    email: {
        type: String,
        // Định dạng email
        unique: true,
        // Kiểm tra tính duy nhất của email
        required: true,
    },
    password: {
        type: String,
        // Mã hóa mật khẩu trước khi lưu vào DB
        required: true,
    },
    avatar_url: {
        type: String,
        //default ảnh đại diện mặc định
        default: "https://static.vecteezy.com/system/resources/previews/036/280/651/original/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-illustration-vector.jpg",
        //  // Đường dẫn đến ảnh đại diện mặc định
    },
    phone: {
        type: Number,
        //default 123456789
        default: 1234567890, // Số điện thoại mặc định
    },
    address: {
        type: String,
        //default không chia sẻ 
        default: "Không chia sẻ",
    },
    gender: {
        type: String,
        default: "Không chia sẻ",
    },
    birthday: {
        type: Date,
        default: new Date("2011-01-01"),
    },
    role: {
        type: Boolean,
        // false: user, true: admin
        // Mặc định là false (người dùng bình thường)
        default: false,
    },
    status: {
        type: Boolean,
        // true: hoạt động, false: không hoạt động
        // Mặc định là true (hoạt động)
        default: true,
    },
    is_verified: {
        type: Boolean,
        // true: đã xác minh, false: chưa xác minh
        // Mặc định là false (chưa xác minh)
        default: false,
    },
    created_date: {
        type: Date,
        default: Date.now,
    },
    modified_date: {
        type: Date,
        default: Date.now,
    },
    fcm_token: { type: String }, // token FCM
});

module.exports = mongoose.model("User", userSchema);
