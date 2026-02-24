import { NextResponse } from "next/server";
import db from "@/lib/db"; // Sesuaikan dengan lokasi instance sqlite kamu

export async function GET() {
    try {
        // Ambil data siswa yang punya foto untuk dataset face-api
        const siswa = db
            .prepare(
                "SELECT uid, nama, foto, kelas, wa, descriptor FROM siswa WHERE descriptor IS NOT NULL",
            )
            .all();

        return NextResponse.json(siswa);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
