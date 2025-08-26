const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true, // dùng TTL
    },
  },
  {
    collection: "otps",
    timestamps: true, // Tự động thêm createdAt, updatedAt
  }
);

// TTL index: MongoDB sẽ tự động xóa OTP khi expiresAt < now
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OTP", OTPSchema);
