const pool = require("../initMySQL");

module.exports = {
  // MySQL → Mongo
  async syncRowToMongo(row, mongooseModel) {
    const connection = await pool.getConnection();

    const filter = row.mongo_id
      ? { _id: row.mongo_id }
      : { image_url: row.image_url };

    const updateDoc = {
      product_id: row.product_mongo_id,
      image_url: row.image_url,
    };

    try {
      const result = await mongooseModel.updateOne(filter, { $set: updateDoc }, { upsert: true });

      if (!row.mongo_id) {
        const doc = await mongooseModel.findOne(filter);
        if (!doc || !doc._id) return;

        await connection.execute(
          `UPDATE product_images SET mongo_id = ? WHERE id = ?`,
          [doc._id.toString(), row.id]
        );

        console.log(`🔗 Cập nhật mongo_id cho product_image id=${row.id}`);
      }
    } catch (error) {
      console.error(`❌ Lỗi đồng bộ product_image từ MySQL → Mongo:`, error);
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
        INSERT INTO product_images (mongo_id, product_id, image_url)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          image_url=VALUES(image_url)
      `,
        [
          doc._id.toString(),
          doc.product_id?.toString(),
          doc.image_url,
        ]
      );

      console.log(`✅ Synced product_image mongo_id=${doc._id}`);
    } catch (error) {
      console.error(`❌ Lỗi đồng bộ product_image từ Mongo → MySQL:`, error);
    } finally {
      connection.release();
    }
  },

  // Mongo → MySQL: Xóa
  async deleteFromMySQL(mongoId) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `DELETE FROM product_images WHERE mongo_id = ?`,
        [mongoId.toString()]
      );

      console.log(`🗑️ Đã xóa product_image mongo_id=${mongoId} khỏi MySQL`);
    } catch (error) {
      console.error(`❌ Lỗi xóa product_image khỏi MySQL:`, error);
    } finally {
      connection.release();
    }
  },

  // MySQL → Mongo: Xóa
  async deleteFromMongo(mongoId, mongooseModel) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT id FROM product_images WHERE mongo_id = ?`,
        [mongoId.toString()]
      );

      if (rows.length === 0) {
        const result = await mongooseModel.deleteOne({ _id: mongoId });
        if (result.deletedCount > 0) {
          console.log(`🗑️ Đã xóa product_image _id=${mongoId} khỏi MongoDB`);
        } else {
          console.warn(`⚠️ Không tìm thấy product_image _id=${mongoId} trong MongoDB`);
        }
      }
    } catch (error) {
      console.error(`❌ Lỗi xóa product_image khỏi MongoDB:`, error);
    } finally {
      connection.release();
    }
  },
};
