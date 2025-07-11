const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Variant = require("../models/Variant");
const ProductImage = require("../models/ProductImage");
const sync = require("../sync/syncManager");
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
    await sync.initialSyncAllFromMongo();

    sync.startRealtimeSync("User", User);
    sync.startReversePolling("User", User);
    sync.startRealtimeSync("Product", Product);
    sync.startReversePolling("Product", Product);
    sync.startRealtimeSync("Category", Category);
    sync.startReversePolling("Category", Category);
    sync.startRealtimeSync("Variant", Variant);
    sync.startReversePolling("Variant", Variant);
    sync.startRealtimeSync("ProductImage", ProductImage);
    sync.startReversePolling("ProductImage", ProductImage);
    sync.startRealtimeSync("Color", require("../models/Color"));
    sync.startReversePolling("Color", require("../models/Color"));
    sync.startRealtimeSync("Size", require("../models/Size"));
    sync.startReversePolling("Size", require("../models/Size"));

    console.log("🔄 Đã khởi động sync");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
