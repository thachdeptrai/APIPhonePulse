const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const googleClient = new OAuth2Client();

exports.socialLogin = async (req, res) => {
  const { provider, access_token } = req.body;

  try {
    let userData = null;

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
    } else {
      return res.status(400).json({ success: false, message: "Unsupported provider" });
    }

    let user = await User.findOne({ email: userData.email });

    if (!user) {
      user = new User(userData);
      await user.save();
    } else {
      if (!user.googleId && userData.googleId) {
        user.googleId = userData.googleId;
        user.provider = "google";
        user.is_verified = true;
        await user.save();
      }
    }

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
