// db.js
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.MYSQLHOST || 'mysql.railway.internal',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'NhBszyfUnSLxrPUWwFkynhWYdnUbXzAu',
  database: process.env.MYSQLDATABASE || 'railway',
  port: process.env.MYSQLPORT || 3306
});

db.connect(err => {
  if (err) {
    console.error('❌ MySQL connection failed:', err);
  } else {
    console.log('✅ Connected to Railway MySQL database!');
  }
});

module.exports = db;
