import mysql from "mysql2/promise";

const db = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: "inventory_manager",
  waitForConnections: true,
  connectionLimit: 10,
});

export default db;