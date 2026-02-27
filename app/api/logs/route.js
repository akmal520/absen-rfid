import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
    try {
        const logs = db
            .prepare("SELECT * FROM logs ORDER BY waktu DESC LIMIT 50")
            .all();
        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// HAPUS SEMUA LOGS
export async function DELETE() {
    try {
        db.prepare("DELETE FROM logs").run();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
