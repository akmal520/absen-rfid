// app/api/absensi/[uid]/[tanggal]/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(request, { params }) {
    try {
        const { uid, tanggal } = await params;

        const result = db
            .prepare(
                `
            DELETE FROM absensi 
            WHERE uid = ?
            AND DATE(waktu) = DATE(?)
        `,
            )
            .run(uid, tanggal);

        if (result.changes === 0) {
            return NextResponse.json(
                { success: false, message: "Data tidak ditemukan" },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            message: "Data absensi berhasil dihapus",
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 },
        );
    }
}
