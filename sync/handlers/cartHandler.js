const initMySQL = require("../initMySQL");

module.exports = {
  // 🟩 MySQL → Mongo
  async syncRowToMongo(row, model) {
    const filter = row.mongo_id ? { _id: row.mongo_id } : { userId: row.user_id };

    let items = [];
    try {
      items = JSON.parse(row.items_json || '[]');
    } catch (err) {
      console.warn(`⚠️ Không parse được items_json:`, err.message);
    }

    const updateDoc = {
      userId: row.user_id,
      items: items,
      modified_date: row.modified_date,
    };

    await model.updateOne(filter, { $set: updateDoc }, { upsert: true });

    // Ghi lại mongo_id nếu chưa có
    if (!row.mongo_id) {
      const found = await model.findOne({ userId: row.user_id });
      if (found) {
        const conn = await initMySQL.getConnection();
        await conn.execute(`UPDATE carts SET mongo_id = ? WHERE id = ?`, [
          found._id.toString(),
          row.id,
        ]);
        conn.release();
      }
    }

  },

  // 🟦 Mongo → MySQL
  async syncDocumentToMySQL(doc) {
    const conn = await initMySQL.getConnection();

    const itemsJson = JSON.stringify(doc.items || []);

    await conn.execute(
      `INSERT INTO carts (mongo_id, user_id, items_json, modified_date)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         items_json=VALUES(items_json),
         modified_date=VALUES(modified_date)`,
      [doc._id.toString(), doc.userId.toString(), itemsJson, doc.modified_date]
    );

    conn.release();
  },

  // ❌ Mongo → xóa bên MySQL
  async deleteFromMySQL(mongoId, conn) {
    const [result] = await conn.execute(`DELETE FROM carts WHERE mongo_id = ?`, [mongoId.toString()]);
    if (result.affectedRows > 0) {
      console.log(`🗑️ Deleted cart in MySQL with mongo_id=${mongoId}`);
    }
  },

  // ❌ MySQL → xóa bên Mongo
  async deleteFromMongo(mongoId, model) {
    const conn = await initMySQL.getConnection();
    const [rows] = await conn.execute(`SELECT * FROM carts WHERE mongo_id = ?`, [mongoId.toString()]);
    conn.release();

    if (rows.length === 0) {
      const result = await model.deleteOne({ _id: mongoId.toString() });
      console.log(`🗑️ Deleted cart ${mongoId}, result: ${result.deletedCount}`);
    } else {
      console.warn(`⚠️ Skip delete cart ${mongoId} - still in MySQL`);
    }
  },
};
