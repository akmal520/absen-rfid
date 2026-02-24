import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request) {
    // 1. Tambahkan parameter request di sini
    try {
        const { searchParams } = new URL(request.url);
        const tglMulai = searchParams.get("tglMulai");
        const tglSelesai = searchParams.get("tglSelesai");

        // Base Query - Bagian akhir (GROUP BY) dipisah dulu
        let queryStr = `
            SELECT 
                s.uid,
                s.nama,
                s.kelas,
                DATE(a.waktu) AS tanggal,
                strftime('%H:%M', MIN(CASE WHEN a.status IN ('masuk','terlambat') THEN a.waktu END)) AS jam_masuk,
                strftime('%H:%M', MAX(CASE WHEN a.status = 'pulang' THEN a.waktu END)) AS jam_pulang,
                MAX(a.telat_menit) AS telat_menit,
                CASE WHEN MAX(a.telat_menit) > 0 THEN 'Terlambat' ELSE 'Hadir' END AS keterangan
            FROM absensi a
            INNER JOIN siswa s ON a.uid = s.uid
            WHERE 1=1
        `;

        const params = [];

        // 2. Filter Tanggal diletakkan SEBELUM Group By
        if (tglMulai && tglSelesai) {
            queryStr += ` AND DATE(a.waktu) BETWEEN ? AND ? `;
            params.push(tglMulai, tglSelesai);
        }

        // 3. Tambahkan Group By dan Order By di akhir string
        queryStr += `
            GROUP BY a.uid, DATE(a.waktu)
            ORDER BY tanggal DESC
        `;

        const rows = db.prepare(queryStr).all(...params);

        return NextResponse.json({ rows, message: "Success" }, { status: 200 });
    } catch (error) {
        console.error("API Rekap Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
