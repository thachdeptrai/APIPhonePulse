const initMySQL = require("../initMySQL");

module.exports = {
  async syncRowToMongo(row, model) {
    const filter = row.mongo_id ? { _id: row.mongo_id } : { size_name: row.size_name };
    const updateDoc = {
      size_name: row.size_name,
      storage: row.storage ,
      created_date: row.created_date,
      modified_date: row.modified_date,
    };
    await model.updateOne(filter, { $set: updateDoc }, { upsert: true });

    if (!row.mongo_id) {
      const found = await model.findOne({ size_name: row.size_name });
      if (found) {
        const conn = await initMySQL.getConnection();
        await conn.execute(`UPDATE sizes SET mongo_id = ? WHERE id = ?`, [
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
      `INSERT INTO sizes (mongo_id, size_name, storage , created_date, modified_date)
       VALUES (?, ?, ?, ?,?)
     ON DUPLICATE KEY UPDATE
         size_name=VALUES(size_name),
         storage=VALUES(storage),
         modified_date=VALUES(modified_date)`,
      [doc._id.toString(), doc.size_name,doc.storage, doc.created_date, doc.modified_date]
    );
    conn.release();
  },

  async deleteFromMongo(mongoId, model) {
    const conn = await initMySQL.getConnection();
    const [rows] = await conn.execute(`SELECT * FROM sizes WHERE mongo_id = ?`, [mongoId.toString()]);
    conn.release();

    if (rows.length === 0) {
      const result = await model.deleteOne({ _id: mongoId.toString() });
      console.log(`🗑️ Deleted size ${mongoId}, result: ${result.deletedCount}`);
    } else {
      console.warn(`⚠️ Skip delete size ${mongoId} - still in MySQL`);
    }
  },

  async deleteFromMySQL(mongoId, conn) {
    const [result] = await conn.execute(`DELETE FROM sizes WHERE mongo_id = ?`, [mongoId.toString()]);
    if (result.affectedRows > 0) {
      console.log(`🗑️ Deleted size in MySQL with mongo_id=${mongoId}`);
    }
  },
};
