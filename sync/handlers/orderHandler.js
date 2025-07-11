const initMySQL = require("../initMySQL");

module.exports = {
  // ✅ Sync từ MySQL → Mongo
  async syncRowToMongo(row, model) {
    const filter = row.mongo_id ? { _id: row.mongo_id } : { created_date: row.created_date };
    const updateDoc = {
      userId: row.user_id,
      items: JSON.parse(row.items_json || "[]"),
      discount_amount: row.discount_amount ?? 0,
      final_price: row.final_price,
      status: row.status,
      shipping_address: row.shipping_address,
      payment_method: row.payment_method,
      payment_status: row.payment_status,
      shipping_status: row.shipping_status,
      note: row.note,
      shipping_date: row.shipping_date,
      delivered_date: row.delivered_date,
      created_date: row.created_date,
      modified_date: row.modified_date,
    };

    await model.updateOne(filter, { $set: updateDoc }, { upsert: true });

    if (!row.mongo_id) {
      const found = await model.findOne({ created_date: row.created_date });
      if (found) {
        const conn = await initMySQL.getConnection();
        await conn.execute(`UPDATE orders SET mongo_id = ? WHERE id = ?`, [
          found._id.toString(),
          row.id,
        ]);
        conn.release();
      }
    }
  },

  // ✅ Sync từ Mongo → MySQL
  async syncDocumentToMySQL(doc) {
    const conn = await initMySQL.getConnection();

    const values = [
      doc._id?.toString() ?? null,
      doc.userId?.toString() ?? null,
      JSON.stringify(doc.items || []),
      doc.discount_amount ?? 0,
      doc.final_price ?? 0,
      doc.status ?? 'pending',
      doc.shipping_address ?? '',
      doc.payment_method ?? '',
      doc.payment_status ?? 'unpaid',
      doc.shipping_status ?? 'not_shipped',
      doc.note ?? null,
      doc.shipping_date ?? null,
      doc.delivered_date ?? null,
      doc.created_date ?? new Date(),
      doc.modified_date ?? new Date(),
    ];

    await conn.execute(
      `INSERT INTO orders (
         mongo_id, user_id, items_json, discount_amount, final_price, status,
         shipping_address, payment_method, payment_status, shipping_status,
         note, shipping_date, delivered_date, created_date, modified_date
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         items_json=VALUES(items_json),
         discount_amount=VALUES(discount_amount),
         final_price=VALUES(final_price),
         status=VALUES(status),
         shipping_address=VALUES(shipping_address),
         payment_method=VALUES(payment_method),
         payment_status=VALUES(payment_status),
         shipping_status=VALUES(shipping_status),
         note=VALUES(note),
         shipping_date=VALUES(shipping_date),
         delivered_date=VALUES(delivered_date),
         modified_date=VALUES(modified_date)`,
      values
    );

    conn.release();
  },

  // ✅ Xóa từ Mongo (khi không còn trong MySQL)
  async deleteFromMongo(mongoId, model) {
    const conn = await initMySQL.getConnection();
    const [rows] = await conn.execute(`SELECT * FROM orders WHERE mongo_id = ?`, [mongoId.toString()]);
    conn.release();

    if (rows.length === 0) {
      const result = await model.deleteOne({ _id: mongoId.toString() });
      console.log(`🗑️ Đã xóa đơn hàng ${mongoId} khỏi Mongo`);
    } else {
      console.warn(`⚠️ Bỏ qua xoá đơn hàng ${mongoId} vì vẫn còn trong MySQL`);
    }
  },

  // ✅ Xóa từ MySQL (khi Mongo bị delete)
  async deleteFromMySQL(mongoId, conn) {
    const [result] = await conn.execute(`DELETE FROM orders WHERE mongo_id = ?`, [mongoId.toString()]);
    if (result.affectedRows > 0) {
      console.log(`🗑️ Đã xóa đơn hàng trong MySQL với mongo_id=${mongoId}`);
    }
  },
};
