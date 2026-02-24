import { NextResponse } from "next/server";
import db from "@/lib/db";
import * as xlsx from "xlsx";

export async function GET() {
    try {
        const rows = db
            .prepare(
                `
            SELECT 
                uid AS UID,
                nama AS Nama,
                DATE(waktu) AS Tanggal,
                CASE 
                    WHEN MAX(telat_menit) > 0 THEN 'Terlambat'
                    ELSE 'Hadir'
                END AS Keterangan,
                MAX(telat_menit) AS "Menit Telat",
                strftime('%H:%M:%S', MIN(CASE WHEN status IN ('masuk','terlambat') THEN waktu END)) AS "Jam Masuk",
                strftime('%H:%M:%S', MAX(CASE WHEN status = 'pulang' THEN waktu END)) AS "Jam Pulang"
            FROM absensi
            GROUP BY uid, DATE(waktu)
            ORDER BY Tanggal DESC
        `,
            )
            .all();

        const ws = xlsx.utils.json_to_sheet(rows);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Rekap Harian");

        // Generate buffer untuk didownload
        const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            headers: {
                "Content-Disposition":
                    'attachment; filename="rekap-harian.xlsx"',
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
