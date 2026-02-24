import { NextResponse } from "next/server";
import { SignJWT } from "jose"; // Library ringan untuk JWT

export async function POST(req) {
    const { username, password } = await req.json();

    // Ganti dengan kredensial yang kamu inginkan
    if (username === "admin" && password === "admin123") {
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "rahasia_sekolah_123",
        );

        const token = await new SignJWT({ role: "admin" })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("24h") // Token hangus dalam 24 jam
            .sign(secret);

        const response = NextResponse.json({ success: true });

        // Simpan token di Cookie agar Middleware bisa membaca
        response.cookies.set("token", token, {
            httpOnly: true, // Tidak bisa dibaca oleh JavaScript (aman dari XSS)
            secure: process.env.NODE_ENV === "production",
            path: "/",
        });

        return response;
    }

    return NextResponse.json(
        { success: false, message: "Username/Password Salah" },
        { status: 401 },
    );
}
