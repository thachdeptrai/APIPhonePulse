const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: false, // Chỉ bắt buộc nếu là local
  },
  avatar_url: {
    type: String,
    default:
      "https://static.vecteezy.com/system/resources/previews/036/280/651/original/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-illustration-vector.jpg",
  },
  phone: {
    type: Number,
    default: 1234567890,
  },
  address: {
    type: String,
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

  // THÊM CÁC TRƯỜNG ĐỂ GỘP SOCIAL LOGIN
  googleId: {
    type: String,
    default: null,
  },
  facebookId: {
    type: String,
    default: null,
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local',
  },

  //  ROLE & TRẠNG THÁI
  role: {
    type: Boolean,
    default: false, // false: user, true: admin
  },
  status: {
    type: Boolean,
    default: true, // true: hoạt động
  },
  is_verified: {
    type: Boolean,
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
});

module.exports = mongoose.model("User", userSchema);
