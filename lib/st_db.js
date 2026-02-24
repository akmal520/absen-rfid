const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbFolder = path.join(process.cwd(), "data");
if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

const dbPath = path.join(dbFolder, "database.db");
const db = new Database(dbPath);

/**
 * 1. TABEL SISWA
 */
db.prepare(
    `
    CREATE TABLE IF NOT EXISTS siswa (
        uid TEXT PRIMARY KEY,
        nama TEXT NOT NULL,
        kelas TEXT,
        wa TEXT,
        foto TEXT,
        descriptor TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`,
).run();

/**
 * 2. TABEL ABSENSI
 */
db.prepare(
    `
    CREATE TABLE IF NOT EXISTS absensi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT,
        nama TEXT,
        status TEXT,
        waktu DATETIME DEFAULT CURRENT_TIMESTAMP,
        telat_menit INTEGER DEFAULT 0,
        FOREIGN KEY (uid) REFERENCES siswa (uid)
    )
`,
).run();

/**
 * 3. TABEL SETTINGS (Update Terbaru)
 * Digunakan untuk menyimpan konfigurasi jam masuk dan pulang
 */
db.prepare(
    `
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
`,
).run();

// --- SEEDING DATA AWAL (DEFAULT SETTINGS) ---
// Menambahkan jam masuk dan pulang jika belum ada di database
const insertSetting = db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
);
insertSetting.run("jam_masuk", "07:00");
insertSetting.run("jam_pulang", "15:00");

/**
 * 4. MIGRASI / UPGRADE KOLOM
 */
const upgradeDatabase = () => {
    const columnsToAdd = [
        { table: "siswa", column: "kelas", type: "TEXT" },
        { table: "siswa", column: "descriptor", type: "TEXT" },
        { table: "absensi", column: "telat_menit", type: "INTEGER DEFAULT 0" },
    ];

    columnsToAdd.forEach((item) => {
        try {
            db.prepare(
                `ALTER TABLE ${item.table} ADD COLUMN ${item.column} ${item.type}`,
            ).run();
            console.log(`✅ Kolom [${item.column}] siap.`);
        } catch (err) {
            if (!err.message.includes("duplicate column name")) {
                console.error(
                    `❌ Gagal upgrade [${item.column}]:`,
                    err.message,
                );
            }
        }
    });
};

upgradeDatabase();

console.log("🚀 Database & Settings siap digunakan!");
module.exports = db;
