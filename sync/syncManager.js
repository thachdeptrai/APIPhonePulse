// sync/syncManager.js
const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
require('dotenv').config();

const syncFunctions = {};

// Kết nối MySQL
async function initMySQL() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
  });
  return connection;
}
// Dùng mongooseModel.updateOne({ _id }, doc, { upsert: true }) để đẩy vào Mongo
async function syncRowToMongo(modelName, row, mongooseModel) {
    switch (modelName) {
      case 'User':
        await mongooseModel.updateOne(
          { _id: row.id },
          {
            $set: {
              name: row.name,
              email: row.email,
              password: row.password,
              avatar_url: row.avatar_url,
              phone: row.phone,
              address: row.address,
              gender: row.gender,
              birthday: row.birthday,
              role: row.role,
              status: row.status,
              is_verified: row.is_verified,
              created_date: row.created_date,
              modified_date: row.modified_date
            }
          },
          { upsert: true }
        );
        break;
  
      // TODO: model khác
    }
  }
  
// Hàm xử lý insert/update từ MongoDB → MySQL
async function syncDocumentToMySQL(modelName, doc, connection) {
  switch (modelName) {
    case 'User':
      await connection.execute(`
        INSERT INTO users (id, name, email, password, avatar_url, phone, address, gender, birthday, role, status, is_verified, created_date, modified_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          email = VALUES(email),
          password = VALUES(password),
          avatar_url = VALUES(avatar_url),
          phone = VALUES(phone),
          address = VALUES(address),
          gender = VALUES(gender),
          birthday = VALUES(birthday),
          role = VALUES(role),
          status = VALUES(status),
          is_verified = VALUES(is_verified),
          modified_date = VALUES(modified_date)
      `, [
        doc._id.toString(),
        doc.name,
        doc.email,
        doc.password,
        doc.avatar_url,
        doc.phone,
        doc.address,
        doc.gender,
        doc.birthday,
        doc.role,
        doc.status,
        doc.is_verified,
        doc.created_date,
        doc.modified_date
      ]);
      break;

    // TODO: Các model khác
  }
}

// Hàm xử lý delete MongoDB → MySQL
async function deleteFromMySQL(modelName, docId, connection) {
  switch (modelName) {
    case 'User':
      await connection.execute(
        `DELETE FROM users WHERE id = ?`,
        [docId.toString()]
      );
      break;

    // TODO: Các model khác
  }
}

// Realtime bằng Change Stream
// Thêm hàm startRealtimeSync vào syncManager.js

syncFunctions.startRealtimeSync = async function (modelName, mongooseModel) {
    const connection = await initMySQL();
  
    console.log(`📡 Realtime ChangeStream bắt đầu cho model: ${modelName}`);
  
    const changeStream = mongooseModel.watch([], {
      fullDocument: 'updateLookup' // Cần cái này để lấy doc đầy đủ khi update
    });
  
    changeStream.on('change', async (change) => {
      try {
        const doc = change.fullDocument;
  
        // Nếu không có doc (null/undefined) thì skip
        if (!doc) {
          console.warn(`⚠️ Không có fullDocument cho ${modelName}, operation: ${change.operationType}`);
          return;
        }
  
        await syncDocumentToMySQL(modelName, doc, connection);
        console.log(`✅ Realtime synced ${modelName} _id=${doc._id}`);
      } catch (err) {
        console.error(`❌ Lỗi realtime sync ${modelName}:`, err.message);
      }
    });
  
    changeStream.on('error', (err) => {
      console.error(`❌ Change stream error for ${modelName}:`, err.message);
    });
  };

  const lastSyncedMySQL = {};

syncFunctions.startReversePolling = async function (modelName, mongooseModel) {
  const connection = await initMySQL();

  if (!lastSyncedMySQL[modelName]) {
    lastSyncedMySQL[modelName] = new Date(0); // sync từ đầu
  }

  console.log(`⏳ Polling MySQL → Mongo bắt đầu cho model: ${modelName}`);

  setInterval(async () => {
    try {
      const since = lastSyncedMySQL[modelName];

      let query = '', values = [];
      switch (modelName) {
        case 'User':
          query = `SELECT * FROM users WHERE modified_date > ? ORDER BY modified_date ASC`;
          values = [since];
          break;
      }

      const [rows] = await connection.execute(query, values);
      for (const row of rows) {
        await syncRowToMongo(modelName, row, mongooseModel);

        // Cập nhật lastSync
        if (row.modified_date > lastSyncedMySQL[modelName]) {
          lastSyncedMySQL[modelName] = row.modified_date;
        }
      }

      if (rows.length > 0) {
        console.log(`↩️  Đã sync ${rows.length} ${modelName}(s) từ MySQL → Mongo`);
      }
    } catch (err) {
      console.error(`❌ Lỗi reverse sync ${modelName}:`, err.message);
    }
  }, 1 * 1000); // 1 giây
};

module.exports = syncFunctions;
