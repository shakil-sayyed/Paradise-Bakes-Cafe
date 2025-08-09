import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let db: mysql.Connection;

export const connectDB = async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log("✅ MySQL connected");
  } catch (err) {
    console.error("❌ MySQL connection error:", err);
    throw err;
  }
};

export { db };

