import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data/database.db");

// Gunakan singleton pattern agar koneksi tidak menumpuk saat development
const db = global.db || new Database(dbPath);
if (process.env.NODE_ENV !== "production") global.db = db;

export default db;
