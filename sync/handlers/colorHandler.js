const initMySQL = require("../initMySQL");

module.exports = {
  async syncRowToMongo(row, model) {
    const filter = row.mongo_id ? { _id: row.mongo_id } : { color_name: row.color_name };
    const updateDoc = {
      color_name: row.color_name,
      created_date: row.created_date,
      modified_date: row.modified_date,
    };
    await model.updateOne(filter, { $set: updateDoc }, { upsert: true });

    if (!row.mongo_id) {
      const found = await model.findOne({ color_name: row.color_name });
      if (found) {
        const conn = await initMySQL.getConnection();
        await conn.execute(`UPDATE colors SET mongo_id = ? WHERE id = ?`, [
          found._id.toString(),
          row.id,
        ]);
        conn.release();
      }
    }
  },

  async syncDocumentToMySQL(doc) {
    const conn = await initMySQL.getConnection();
    await conn.execute(
      `INSERT INTO colors (mongo_id, color_name, created_date, modified_date)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE color_name=VALUES(color_name), modified_date=VALUES(modified_date)`,
      [doc._id.toString(), doc.color_name, doc.created_date, doc.modified_date]
    );
    conn.release();
  },

  async deleteFromMongo(mongoId, model) {
    const conn = await initMySQL.getConnection();
    const [rows] = await conn.execute(`SELECT * FROM colors WHERE mongo_id = ?`, [mongoId.toString()]);
    conn.release();

    if (rows.length === 0) {
      const result = await model.deleteOne({ _id: mongoId.toString() });
      console.log(`🗑️ Deleted color ${mongoId}, result: ${result.deletedCount}`);
    } else {
      console.warn(`⚠️ Skip delete color ${mongoId} - still in MySQL`);
    }
  },

  async deleteFromMySQL(mongoId, conn) {
    const [result] = await conn.execute(`DELETE FROM colors WHERE mongo_id = ?`, [mongoId.toString()]);
    if (result.affectedRows > 0) {
      console.log(`🗑️ Deleted color in MySQL with mongo_id=${mongoId}`);
    }
  },
};
