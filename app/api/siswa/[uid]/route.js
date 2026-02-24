import { NextResponse } from "next/server";
import db from "@/lib/db";

// UPDATE DATA SISWA
export async function PUT(request, { params }) {
    try {
        // Await params dulu untuk Next.js versi terbaru
        const { uid } = await params;
        const { nama, kelas, wa } = await request.json();

        // Debugging: Cek di terminal/console vscode kamu
        console.log("Mencoba Update UID:", uid);
        console.log("Data Baru:", { nama, kelas, wa });

        // Gunakan trim() untuk jaga-jaga jika ada spasi di awal/akhir UID
        const cleanUid = uid.trim();

        const stmt = db.prepare(
            "UPDATE siswa SET nama = ?, kelas = ?, wa = ? WHERE uid = ?",
        );
        const result = stmt.run(nama, kelas, wa, cleanUid);

        console.log("Jumlah baris berubah:", result.changes);

        if (result.changes > 0) {
            // Jika nama/kelas berubah, update juga di tabel absensi agar rekap sinkron
            const updateAbsen = db.prepare(
                "UPDATE absensi SET nama = ? WHERE uid = ?",
            );
            updateAbsen.run(nama, cleanUid);

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    message: `Siswa dengan UID ${cleanUid} tidak ditemukan di database.`,
                },
                { status: 404 },
            );
        }
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 },
        );
    }
}

// HAPUS SISWA & SELURUH RIWAYATNYA
export async function DELETE(request, { params }) {
    try {
        const { uid } = await params;
        const cleanUid = uid.trim();
        // Hapus dari tabel siswa dan absensi sekaligus untuk jaga-jaga jika ada relasi
        const deleteAbsen = db.prepare("DELETE FROM absensi WHERE uid = ?");
        const deleteSiswa = db.prepare("DELETE FROM siswa WHERE uid = ?");
        deleteAbsen.run(cleanUid);
        deleteSiswa.run(cleanUid);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 },
        );
    }
}
