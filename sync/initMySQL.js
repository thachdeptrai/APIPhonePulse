const mysql = require('mysql2/promise');
require('dotenv').config();

// module.exports = async function initMySQL() {
//   const connection = await mysql.createConnection({
//     host: process.env.MYSQL_HOST,
//     user: process.env.MYSQL_USER,
//     password: process.env.MYSQL_PASSWORD,
//     database: process.env.MYSQL_DB
//   });
//   return connection;
// };
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 20, // số lượng kết nối tối đa tùy bạn
  queueLimit: 0
});

module.exports = pool;
