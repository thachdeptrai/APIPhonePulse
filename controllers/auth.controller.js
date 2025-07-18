const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const axios = require("axios");
require("dotenv").config();

const googleClient = new OAuth2Client();

exports.socialLogin = async (req, res) => {
  const { provider, access_token } = req.body;

  try {
    let userData = null;

    // Xử lý đăng nhập Google
    if (provider === "google") {
      const ticket = await googleClient.verifyIdToken({
        idToken: access_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      userData = {
        provider: "google",
        googleId: payload.sub,
        name: payload.name,
        email: payload.email,
        avatar_url: payload.picture,
        is_verified: true,
      };

    // Xử lý đăng nhập Facebook
    } else if (provider === "facebook") {
      const fbRes = await axios.get("https://graph.facebook.com/me", {
        params: {
          fields: "id,name,email,picture",
          access_token,
        },
      });

      const fb = fbRes.data;

      if (!fb.email) {
        return res.status(400).json({
          success: false,
          message: "Facebook account doesn't have email permission",
        });
      }

      userData = {
        provider: "facebook",
        facebookId: fb.id,
        name: fb.name,
        email: fb.email,
        avatar_url: fb.picture?.data?.url,
        is_verified: true,
      };

    } else {
      return res.status(400).json({ success: false, message: "Unsupported provider" });
    }

    // Tìm hoặc tạo user
    let user = await User.findOne({ email: userData.email });

    if (!user) {
      user = new User(userData);
      await user.save();
    } else {
      let updated = false;

      if (provider === "google" && !user.googleId) {
        user.googleId = userData.googleId;
        updated = true;
      }
      if (provider === "facebook" && !user.facebookId) {
        user.facebookId = userData.facebookId;
        updated = true;
      }

      if (!user.provider || user.provider !== provider) {
        user.provider = provider;
        updated = true;
      }

      if (!user.is_verified) {
        user.is_verified = true;
        updated = true;
      }

      if (updated) await user.save();
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        role: user.role,
        provider: user.provider,
      },
      token,
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
      error: error.message,
    });
  }
};
