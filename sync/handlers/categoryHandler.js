const pool = require("../initMySQL");

module.exports = {
  // ✅ MySQL → Mongo
  async syncRowToMongo(row, mongooseModel) {
    const filter = row.mongo_id ? { _id: row.mongo_id } : { _id: new mongoose.Types.ObjectId() };

    const updateDoc = {
      name: row.name,
      icon: row.icon ?? null,
      created_date: row.created_date,
      modified_date: row.modified_date,
    };

    try {
      await mongooseModel.updateOne(filter, { $set: updateDoc }, { upsert: true });
    } catch (err) {
      console.error(`❌ Lỗi upsert Mongo cho category:`, err);
      return;
    }

    // Nếu chưa có mongo_id → cập nhật lại vào MySQL
    if (!row.mongo_id) {
      try {
        const existingDoc = await mongooseModel.findOne({ name: row.name });
        if (!existingDoc || !existingDoc._id) return;

        const connection = await pool.getConnection();
        try {
          await connection.execute(
            `UPDATE categories SET mongo_id = ? WHERE id = ?`,
            [existingDoc._id.toString(), row.id]
          );
          console.log(`🔗 Cập nhật mongo_id cho category id=${row.id}`);
        } catch (err) {
          console.error(`❌ Lỗi cập nhật mongo_id category id=${row.id}:`, err);
        } finally {
          connection.release();
        }
      } catch (err) {
        console.error(`❌ Lỗi tìm category Mongo sau upsert:`, err);
      }
    }
  },

  // ✅ Mongo → MySQL
  async syncDocumentToMySQL(doc) {
    const mongoIdStr = doc._id?.toString();
    if (!mongoIdStr) return;

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO categories (mongo_id, name, icon, created_date, modified_date)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           icon = VALUES(icon),
           modified_date = VALUES(modified_date)`,
        [
          mongoIdStr,
          doc.name,
          doc.icon ?? null,
          doc.created_date,
          doc.modified_date
        ]
      );
      console.log(`✅ Synced category mongo_id=${mongoIdStr}`);
    } catch (err) {
      console.error(`❌ Lỗi sync category mongo_id=${mongoIdStr}:`, err);
    } finally {
      connection.release();
    }
  },

  // ✅ Mongo → MySQL: Xóa
  async deleteFromMySQL(mongoId) {
    const mongoIdStr = mongoId?.toString();
    if (!mongoIdStr) return;

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        `DELETE FROM categories WHERE mongo_id = ?`,
        [mongoIdStr]
      );

      if (result.affectedRows > 0) {
        console.log(`🗑️ Đã xóa category trong MySQL mongo_id=${mongoIdStr}`);
      } else {
        console.warn(`⚠️ Không tìm thấy category trong MySQL mongo_id=${mongoIdStr}`);
      }
    } catch (err) {
      console.error(`❌ Lỗi xóa category MySQL mongo_id=${mongoIdStr}:`, err);
    } finally {
      connection.release();
    }
  },

  // ✅ MySQL → Mongo: Xóa
  async deleteFromMongo(mongoId, mongooseModel) {
    const mongoIdStr = mongoId?.toString();
    if (!mongoIdStr) return;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT id FROM categories WHERE mongo_id = ?`,
        [mongoIdStr]
      );

      if (rows.length === 0) {
        const result = await mongooseModel.deleteOne({ _id: mongoId });
        if (result.deletedCount > 0) {
          console.log(`🗑️ Đã xóa category _id=${mongoIdStr} khỏi MongoDB`);
        } else {
          console.warn(`⚠️ Không tìm thấy category _id=${mongoIdStr} trong MongoDB`);
        }
      }
    } catch (err) {
      console.error(`❌ Lỗi khi kiểm tra hoặc xóa category Mongo _id=${mongoIdStr}:`, err);
    } finally {
      connection.release();
    }
  }
};
