import { NextResponse } from "next/server";
import db from "@/lib/db";
import * as xlsx from "xlsx";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const kelas = searchParams.get("kelas");
        const tglMulai = searchParams.get("tglMulai");
        const tglSelesai = searchParams.get("tglSelesai");

        // Perhatikan bagian INNER JOIN siswa s ON a.uid = s.uid
        // Ini kunci agar kolom 's.kelas' bisa diakses
        let queryStr = `
            SELECT 
                s.uid AS UID,
                s.nama AS Nama,
                s.kelas AS Kelas,
                DATE(a.waktu) AS Tanggal,
                CASE 
                    WHEN MAX(a.telat_menit) > 0 THEN 'Terlambat'
                    ELSE 'Hadir'
                END AS Keterangan,
                MAX(a.telat_menit) AS "Menit Telat",
                strftime('%H:%M', MIN(CASE WHEN a.status IN ('masuk','terlambat') THEN a.waktu END)) AS "Jam Masuk",
                strftime('%H:%M', MAX(CASE WHEN a.status = 'pulang' THEN a.waktu END)) AS "Jam Pulang"
            FROM absensi a
            INNER JOIN siswa s ON a.uid = s.uid
            WHERE 1=1
        `;

        const params = [];

        // Filter berdasarkan kelas (dari tabel siswa 's')
        if (kelas && kelas !== "Semua") {
            queryStr += ` AND s.kelas = ? `;
            params.push(kelas);
        }

        // Filter berdasarkan tanggal
        if (tglMulai && tglSelesai) {
            queryStr += ` AND DATE(a.waktu) BETWEEN ? AND ? `;
            params.push(tglMulai, tglSelesai);
        }

        queryStr += ` GROUP BY a.uid, DATE(a.waktu) ORDER BY Tanggal DESC`;

        const rows = db.prepare(queryStr).all(...params);

        if (rows.length === 0) {
            // Opsional: berikan pesan jika data kosong agar tidak download file hampa
            return NextResponse.json(
                { message: "Tidak ada data untuk difilter" },
                { status: 404 },
            );
        }

        const ws = xlsx.utils.json_to_sheet(rows);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Rekap Absensi");

        const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            headers: {
                "Content-Disposition": `attachment; filename="rekap-${kelas || "semua"}.xlsx"`,
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
