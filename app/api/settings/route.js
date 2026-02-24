import { NextResponse } from "next/server";
import db from "@/lib/db"; // Sesuaikan path ke file db.js kamu

/**
 * GET: Mengambil konfigurasi jam dari database
 */
export async function GET() {
    try {
        const jamMasuk =
            db
                .prepare("SELECT value FROM settings WHERE key = 'jam_masuk'")
                .get()?.value || "07:00";
        const jamPulang =
            db
                .prepare("SELECT value FROM settings WHERE key = 'jam_pulang'")
                .get()?.value || "15:00";

        return NextResponse.json({
            jam_masuk: jamMasuk,
            jam_pulang: jamPulang,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST: Menyimpan konfigurasi jam baru dari Dashboard
 */
export async function POST(req) {
    try {
        const { jamMasuk, jamPulang } = await req.json();

        if (!jamMasuk || !jamPulang) {
            return NextResponse.json(
                { error: "Jam tidak valid" },
                { status: 400 },
            );
        }

        // Gunakan transaksi agar kedua setting terupdate bersamaan atau tidak sama sekali
        const updateSetting = db.prepare(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        );

        const transaction = db.transaction(() => {
            updateSetting.run("jam_masuk", jamMasuk);
            updateSetting.run("jam_pulang", jamPulang);
        });

        transaction();

        console.log(
            `[⚙️] Konfigurasi diperbarui: Masuk ${jamMasuk}, Pulang ${jamPulang}`,
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("🔥 Settings API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
