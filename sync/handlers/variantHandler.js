const pool = require("../initMySQL");

module.exports = {
  // MySQL → Mongo
  async syncRowToMongo(row, mongooseModel) {
    const connection = await pool.getConnection();

    const filter = row.mongo_id
      ? { _id: row.mongo_id }
      : { product_id: row.product_mongo_id, color_id: row.color_mongo_id, size_id: row.size_mongo_id };

    const updateDoc = {
      product_id: row.product_mongo_id,
      color_id: row.color_mongo_id,
      size_id: row.size_mongo_id,
      quantity: row.quantity,
      price: row.price,
      created_date: row.created_date,
      modified_date: row.modified_date,
    };

    try {
      const result = await mongooseModel.updateOne(filter, { $set: updateDoc }, { upsert: true });

      // Nếu là bản ghi mới được upsert và chưa có mongo_id → cập nhật lại vào MySQL
      if (!row.mongo_id) {
        const doc = await mongooseModel.findOne(filter);
        if (doc && doc._id) {
          await connection.execute(
            `UPDATE variants SET mongo_id = ? WHERE id = ?`,
            [doc._id.toString(), row.id]
          );
          console.log(`🔗 Cập nhật mongo_id cho variant id=${row.id}`);
        }
      }
    } catch (error) {
      console.error(`❌ Lỗi syncRowToMongo variant id=${row.id}:`, error);
    } finally {
      connection.release();
    }
  },

  // Mongo → MySQL
  async syncDocumentToMySQL(doc) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `
        INSERT INTO variants (
          mongo_id, product_id, color_id, size_id,
          quantity, price, created_date, modified_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          quantity=VALUES(quantity),
          price=VALUES(price),
          modified_date=VALUES(modified_date)
      `,
        [
          doc._id.toString(),
          doc.product_id?.toString(),
          doc.color_id?.toString(),
          doc.size_id?.toString(),
          doc.quantity,
          doc.price,
          doc.created_date,
          doc.modified_date
        ]
      );

      console.log(`✅ Đồng bộ variant mongo_id=${doc._id} → MySQL`);
    } catch (error) {
      console.error(`❌ Lỗi syncDocumentToMySQL variant mongo_id=${doc._id}:`, error);
    } finally {
      connection.release();
    }
  },

  // Mongo → MySQL: Xóa
  async deleteFromMySQL(mongoId) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(`DELETE FROM variants WHERE mongo_id = ?`, [mongoId.toString()]);
      console.log(`🗑️ Đã xóa variant mongo_id=${mongoId} khỏi MySQL`);
    } catch (error) {
      console.error(`❌ Lỗi xóa variant mongo_id=${mongoId} từ MySQL:`, error);
    } finally {
      connection.release();
    }
  },

  // MySQL → Mongo: Xóa
  async deleteFromMongo(mongoId, mongooseModel) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT id FROM variants WHERE mongo_id = ?`,
        [mongoId.toString()]
      );

      if (rows.length === 0) {
        const result = await mongooseModel.deleteOne({ _id: mongoId });
        if (result.deletedCount > 0) {
          console.log(`🗑️ Đã xóa variant _id=${mongoId} khỏi MongoDB`);
        } else {
          console.warn(`⚠️ Không tìm thấy variant _id=${mongoId} trong MongoDB`);
        }
      }
    } catch (error) {
      console.error(`❌ Lỗi khi xóa variant _id=${mongoId} khỏi MongoDB:`, error);
    } finally {
      connection.release();
    }
  },
};
