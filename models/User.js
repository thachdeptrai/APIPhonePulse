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
    password_hash: {
        type: String,
        required: true,
    },
    avatar_url: {
        type: String,
    },
    phone: {
        type: String,
    },
    is_admin: {
        type: Boolean,
        default: false,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("User", userSchema);
