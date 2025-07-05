const mysql = require('mysql2/promise');
require('dotenv').config();

module.exports = async function initMySQL() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
  });
  return connection;
};
