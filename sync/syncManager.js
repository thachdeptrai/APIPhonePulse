const mongoose = require('mongoose');
const initMySQL = require('./initMySQL');
const userHandler = require('./handlers/userHandler');
// const productHandler = require('./handlers/productHandler'); // sẵn sàng cho scale

const syncFunctions = {};

const handlerMap = {
  User: userHandler,
  // Product: productHandler
};

// Reverse sync: MySQL → Mongo
syncFunctions.startReversePolling = async function (modelName, mongooseModel) {
  const handler = handlerMap[modelName];
  if (!handler) throw new Error(`❌ Không có handler cho model: ${modelName}`);

  const connection = await initMySQL();
  const lastSynced = new Date(0);

  console.log(`⏳ Polling MySQL → Mongo cho ${modelName}`);

  setInterval(async () => {
    try {
      // 1. Lấy toàn bộ hàng để check xóa
      const [allRows] = await connection.execute(`SELECT mongo_id FROM users`);
      const mysqlIdSet = new Set(allRows.map(r => r.mongo_id?.toString()).filter(Boolean));

      // 2. Lấy toàn bộ doc Mongo để so sánh
      const mongoDocs = await mongooseModel.find({}, '_id');
      for (const doc of mongoDocs) {
        if (!mysqlIdSet.has(doc._id.toString())) {
          await handler.deleteFromMongo(doc._id, mongooseModel);
        }
      }

      // 3. Lấy dữ liệu mới/cập nhật từ MySQL
      const [rows] = await connection.execute(
        `SELECT * FROM users WHERE modified_date > ?`,
        [lastSynced]
      );

      for (const row of rows) {
        await handler.syncRowToMongo(row, mongooseModel);
        if (row.modified_date > lastSynced) {
          lastSynced.setTime(new Date(row.modified_date).getTime());
        }
      }

      if (rows.length > 0) {
        console.log(`↩️  Đã sync ${rows.length} ${modelName}(s) từ MySQL → Mongo`);
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

  const connection = await initMySQL();

  console.log(`📡 Listening ChangeStream cho ${modelName}`);

  const changeStream = mongooseModel.watch([], {
    fullDocument: 'updateLookup',
  });

  changeStream.on('change', async (change) => {
    try {
      const doc = change.fullDocument;

      if (change.operationType === 'delete') {
        await handler.deleteFromMySQL(change.documentKey._id, connection);
        return;
      }

      if (doc) {
        await handler.syncDocumentToMySQL(doc, connection);
        console.log(`✅ Realtime synced ${modelName} _id=${doc._id}`);
      }
    } catch (err) {
      console.error(`❌ Lỗi ChangeStream ${modelName}:`, err.message);
    }
  });

  changeStream.on('error', (err) => {
    console.error(`💥 ChangeStream error: ${err.message}`);
  });
};

module.exports = syncFunctions;
