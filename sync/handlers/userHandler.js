const initMySQL = require('../initMySQL');

module.exports = {
  // MySQL → Mongo
  async syncRowToMongo(row, mongooseModel) {
    const connection = await initMySQL();
    const filter = row.mongo_id ? { _id: row.mongo_id } : { email: row.email };

    const updateDoc = {
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
    };

    try {
      await mongooseModel.updateOne(filter, { $set: updateDoc }, { upsert: true });
    } catch (err) {
      if (err.code === 11000) {
        console.warn(`⚠️ Trùng email: ${row.email}`);
        return;
      }
      throw err;
    }

    // Nếu chưa có mongo_id → cập nhật lại vào MySQL
    if (!row.mongo_id) {
      const existingDoc = await mongooseModel.findOne({ email: row.email });
      if (existingDoc) {
        await connection.execute(
          `UPDATE users SET mongo_id = ? WHERE id = ?`,
          [existingDoc._id.toString(), row.id]
        );
        console.log(`🔗 Cập nhật mongo_id cho user id=${row.id}`);
      }
    }
  },

  // Mongo → MySQL
  async syncDocumentToMySQL(doc, connection) {
    await connection.execute(`
      INSERT INTO users (
        mongo_id, name, email, password, avatar_url, phone,
        address, gender, birthday, role, status, is_verified,
        created_date, modified_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), email=VALUES(email), password=VALUES(password),
        avatar_url=VALUES(avatar_url), phone=VALUES(phone),
        address=VALUES(address), gender=VALUES(gender), birthday=VALUES(birthday),
        role=VALUES(role), status=VALUES(status), is_verified=VALUES(is_verified),
        modified_date=VALUES(modified_date)
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
  },

  // Xóa từ Mongo → MySQL (khi ChangeStream báo `delete`)
  async deleteFromMySQL(mongoId, connection) {
    try {
      const [result] = await connection.execute(
        `DELETE FROM users WHERE mongo_id = ?`,
        [mongoId.toString()]
      );

      if (result.affectedRows > 0) {
        console.log(`🗑️ Đã xóa user trong MySQL có mongo_id=${mongoId}`);
      } else {
        console.warn(`⚠️ Không tìm thấy user với mongo_id=${mongoId} trong MySQL`);
      }
    } catch (err) {
      console.error(`❌ Lỗi khi xóa từ MySQL:`, err.message);
    }
  },

  // Xóa từ MySQL → Mongo (trong reverse polling)
  async deleteFromMongo(mongoId, mongooseModel) {
    const connection = await initMySQL();

    // Kiểm tra nếu vẫn còn trong MySQL thì không được xóa Mongo
    const [rows] = await connection.execute(
      `SELECT * FROM users WHERE mongo_id = ?`,
      [mongoId.toString()]
    );

    if (rows.length > 0) {
      console.warn(`🚫 Bỏ qua xóa Mongo _id=${mongoId} vì user vẫn tồn tại trong MySQL`);
      return;
    }

    // OK, xóa bình thường trong Mongo
    const result = await mongooseModel.deleteOne({ _id: mongoId.toString() });

    if (result.deletedCount > 0) {
      console.log(`🗑️ Đã xóa user _id=${mongoId} khỏi MongoDB`);
    } else {
      console.warn(`⚠️ Không tìm thấy user _id=${mongoId} trong MongoDB`);
    }
  }
};
