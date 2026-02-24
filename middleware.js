import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export default async function middleware(req) {
    const token = req.cookies.get("token")?.value;
    const { pathname } = req.nextUrl;

    // 1. Jika mencoba buka dashboard tapi tidak ada token
    if ((pathname === "/" || pathname.startsWith("/dashboard")) && !token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // 2. Jika ada token, verifikasi validitasnya
    if (token) {
        try {
            const secret = new TextEncoder().encode(
                process.env.JWT_SECRET || "rahasia_sekolah_123",
            );
            await jwtVerify(token, secret);

            // Jika sudah login dan mencoba ke halaman login lagi, lempar ke dashboard
            if (pathname === "/login") {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }
        } catch (e) {
            // Jika token palsu/expired, hapus cookie dan tendang ke login
            const response = NextResponse.redirect(new URL("/login", req.url));
            response.cookies.delete("token");
            return response;
        }
    }

    return NextResponse.next();
}

// Hanya proteksi route dashboard
export const config = {
    matcher: ["/", "/dashboard/:path*", "/login"],
};
