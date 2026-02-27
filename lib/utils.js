const db = require("./st_db"); // Impor koneksi database kamu

function cleanupOldLogs() {
    try {
        // SQL ini akan menghapus semua baris yang lebih lama dari 7 hari
        const info = db
            .prepare("DELETE FROM logs WHERE waktu < date('now', '-7 days')")
            .run();

        if (info.changes > 0) {
            console.log(
                `[🧹 Maintenance] Berhasil menghapus ${info.changes} log lama.`,
            );
        } else {
            console.log(
                `[🧹 Maintenance] Tidak ada log lama yang perlu dihapus.`,
            );
        }
    } catch (error) {
        console.error("[❌ Maintenance] Gagal membersihkan log:", error);
    }
}

// Gunakan module.exports agar bisa dibaca oleh server.js
module.exports = { cleanupOldLogs };
