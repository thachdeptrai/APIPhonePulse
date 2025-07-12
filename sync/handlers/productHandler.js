const pool = require("../initMySQL");

module.exports = {
  // ✅ MySQL → Mongo
  async syncRowToMongo(row, mongooseModel) {
    const connection = await pool.getConnection();

    const filter = row.mongo_id
      ? { _id: row.mongo_id }
      : { product_name: row.product_name };

    const updateDoc = {
      product_name: row.product_name,
      description: row.description,
      category_id: row.category_id,
      variant_id: row.variant_id,
      productimage_id: row.productimage_id,
      created_date: row.created_date,
      modified_date: row.modified_date,
    };

    try {
      const result = await mongooseModel.updateOne(
        filter,
        { $set: updateDoc },
        { upsert: true }
      );

      if (!row.mongo_id) {
        const doc = await mongooseModel.findOne({ product_name: row.product_name });
        if (!doc || !doc._id) return;

        await connection.execute(
          `UPDATE products SET mongo_id = ? WHERE id = ?`,
          [doc._id.toString(), row.id]
        );

        console.log(`🔗 Cập nhật mongo_id cho product id=${row.id}`);
      }
    } catch (error) {
      console.error(`❌ Lỗi đồng bộ product từ MySQL → Mongo:`, error);
    } finally {
      connection.release();
    }
  },

  // ✅ Mongo → MySQL
  async syncDocumentToMySQL(doc) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `
        INSERT INTO products (
          mongo_id, product_name, description,
          category_id, variant_id, productimage_id,
          created_date, modified_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          product_name=VALUES(product_name),
          description=VALUES(description),
          category_id=VALUES(category_id),
          variant_id=VALUES(variant_id),
          productimage_id=VALUES(productimage_id),
          modified_date=VALUES(modified_date)
      `,
        [
          doc._id.toString(),
          doc.product_name,
          doc.description,
          doc.category_id?.toString(),
          doc.variant_id?.toString(),
          doc.productimage_id?.toString(),
          doc.created_date,
          doc.modified_date,
        ]
      );

      console.log(`✅ Synced product mongo_id=${doc._id}`);
    } catch (error) {
      console.error(`❌ Lỗi đồng bộ product từ Mongo → MySQL:`, error);
    } finally {
      connection.release();
    }
  },

  // ✅ Xóa từ Mongo → MySQL
  async deleteFromMySQL(mongoId) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        `DELETE FROM products WHERE mongo_id = ?`,
        [mongoId.toString()]
      );

      if (result.affectedRows > 0) {
        console.log(`🗑️ Đã xóa product trong MySQL mongo_id=${mongoId}`);
      } else {
        console.warn(`⚠️ Không tìm thấy product trong MySQL mongo_id=${mongoId}`);
      }
    } catch (error) {
      console.error(`❌ Lỗi khi xóa product khỏi MySQL:`, error);
    } finally {
      connection.release();
    }
  },

  // ✅ Xóa từ MySQL → Mongo
  async deleteFromMongo(mongoId, mongooseModel) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT id FROM products WHERE mongo_id = ?`,
        [mongoId.toString()]
      );

      if (rows.length === 0) {
        const result = await mongooseModel.deleteOne({ _id: mongoId });
        if (result.deletedCount > 0) {
          console.log(`🗑️ Đã xóa product _id=${mongoId} khỏi MongoDB`);
        } else {
          console.warn(`⚠️ Không tìm thấy product _id=${mongoId} trong MongoDB`);
        }
      }
    } catch (error) {
      console.error(`❌ Lỗi khi xóa product khỏi MongoDB:`, error);
    } finally {
      connection.release();
    }
  },
};
