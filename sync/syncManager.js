const mongoose = require("mongoose");
const initMySQL = require("./initMySQL");
const userHandler = require("./handlers/userHandler");
const productHandler = require("./handlers/productHandler");
const categoryHandler = require("./handlers/categoryHandler");
const variantHandler = require("./handlers/variantHandler");
const productImageHandler = require("./handlers/productImageHandler");
const Colorhandler = require("./handlers/colorHandler");
const sizehandler = require("./handlers/sizeHandler");
const cartHandler = require("./handlers/cartHandler");
const orderHandler = require("./handlers/orderHandler");


const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const ProductImage = require("../models/ProductImage");
const Variant = require("../models/Variant");
const colors = require("../models/Color");
const Size = require("../models/Size");
const Cart = require("../models/Cart");
const Order = require("../models/Order");

const syncFunctions = {};

const modelMap = {
  User: User,
  Product: Product,
  Category: Category,
  Variant: Variant,
  ProductImage: ProductImage,
  Color: colors,
  Size: Size,
  Cart: Cart,
  Order: Order,
};

const handlerMap = {
  User: userHandler,
  Product: productHandler,
  Category: categoryHandler,
  Variant: variantHandler,
  ProductImage: productImageHandler,
  Color: Colorhandler,
  Size: sizehandler,
  Cart: cartHandler,
  Order: orderHandler,
  
};
const tableMap = {
  User: "users",
  Product: "products",
  Category: "categories",
  Variant: "variants",
  ProductImage: "product_images",
  Color: "colors",
  Size: "sizes",
  Cart: "carts",
};

// Reverse sync: MySQL → Mongo
syncFunctions.startReversePolling = async function (modelName) {
  const mongooseModel = modelMap[modelName];
  const handler = handlerMap[modelName];
  if (!handler) throw new Error(`❌ Không có handler cho model: ${modelName}`);

  const connection = await initMySQL.getConnection();
  const lastSynced = new Date(0);

  console.log(`⏳ Polling MySQL → Mongo cho ${modelName}`);

  setInterval(async () => {
    try {
      // 1. Lấy toàn bộ hàng để check xóa
      const tableName = tableMap[modelName];
      const [allRows] = await connection.execute(
        `SELECT mongo_id FROM ${tableName}`
      );
      const mysqlIdSet = new Set(
        allRows.map((r) => r.mongo_id?.toString()).filter(Boolean)
      );

      // 2. Lấy toàn bộ doc Mongo để so sánh
      const mongoDocs = await mongooseModel.find({}, "_id");
      for (const doc of mongoDocs) {
        if (!mysqlIdSet.has(doc._id.toString())) {
          await handler.deleteFromMongo(doc._id, mongooseModel);
        }
      }

      // 3. Lấy dữ liệu mới/cập nhật từ MySQL
      const [rows] = await connection.execute(
        `SELECT * FROM ${tableName} WHERE modified_date > ?`,
        [lastSynced]
      );

      for (const row of rows) {
        await handler.syncRowToMongo(row, mongooseModel);
        if (row.modified_date > lastSynced) {
          lastSynced.setTime(new Date(row.modified_date).getTime());
        }
      }

      if (rows.length > 0) {
        console.log(
          `↩️  Đã sync ${rows.length} ${modelName}(s) từ MySQL → Mongo`
        );
      }
    } catch (err) {
      console.error(`❌ Lỗi polling ${modelName}:`, err.message);
    }
  }, 1000); // 1 giây
};

// Realtime sync: Mongo → MySQL
syncFunctions.startRealtimeSync = async function (modelName, mongooseModel) {
  const handler = handlerMap[modelName];
  if (!handler) throw new Error(`❌ Không có handler cho model: ${modelName}`);

  const connection = await initMySQL.getConnection();

  console.log(`📡 Listening ChangeStream cho ${modelName}`);

  const changeStream = mongooseModel.watch([], {
    fullDocument: "updateLookup",
  });

  changeStream.on("change", async (change) => {
    try {
      const doc = change.fullDocument;

      if (change.operationType === "delete") {
        await handler.deleteFromMySQL(change.documentKey._id, connection);
        return;
      }

      if (doc) {
        await handler.syncDocumentToMySQL(doc, connection);
        connection.release();
        console.log(`✅ Realtime synced ${modelName} _id=${doc._id}`);
      }
    } catch (err) {
      console.error(`❌ Lỗi ChangeStream ${modelName}:`, err.message);
    }
  });

  changeStream.on("error", (err) => {
    console.error(`💥 ChangeStream error: ${err.message}`);
  });
};
// ✅ Hàm sync từng model từ Mongo → MySQL
syncFunctions.initialSyncFromMongo = async function (modelName) {
  const mongooseModel = modelMap[modelName];
  const handler = handlerMap[modelName];

  if (!mongooseModel || !handler) {
    console.warn(`❌ Không tìm thấy model hoặc handler cho ${modelName}`);
    return;
  }

  const docs = await mongooseModel.find();

  console.log(`🔁 Sync ${docs.length} ${modelName} từ Mongo → MySQL`);

  for (const doc of docs) {
    try {
      await handler.syncDocumentToMySQL(doc);
    } catch (err) {
      console.error(`❌ Lỗi sync ${modelName} _id=${doc._id}:`, err.message);
    }
  }

  console.log(`✅ Đã hoàn tất sync ${modelName}`);
};

// ✅ Hàm sync toàn bộ model từ Mongo → MySQL (chỉ gọi 1 lần khi khởi tạo hệ thống)
syncFunctions.initialSyncAllFromMongo = async function () {
  const models = Object.keys(modelMap);

  for (const modelName of models) {
    await syncFunctions.initialSyncFromMongo(modelName);
  }

  console.log("🎉 Đã hoàn tất initial sync Mongo → MySQL cho tất cả model");
};

module.exports = syncFunctions;
