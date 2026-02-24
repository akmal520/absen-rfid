// import { NextResponse } from "next/server";
// import db from "@/lib/db";
// import { writeFile, mkdir } from "fs/promises";
// import path from "path";

// export async function POST(request) {
//     try {
//         const formData = await request.formData();
//         const uid = formData.get("uid");
//         const nama = formData.get("nama");
//         const kelas = formData.get("kelas");
//         const wa = formData.get("wa");
//         const file = formData.get("foto"); // Ini hasil capture blob

//         if (!uid || !nama || !file) {
//             return NextResponse.json(
//                 { success: false, message: "Data tidak lengkap" },
//                 { status: 400 },
//             );
//         }

//         // Pastikan folder uploads ada
//         const uploadDir = path.join(process.cwd(), "public/uploads");
//         try {
//             await mkdir(uploadDir, { recursive: true });
//         } catch (e) {}

//         // Simpan Foto dengan nama UID.jpg (Timpa jika sudah ada)
//         const bytes = await file.arrayBuffer();
//         const buffer = Buffer.from(bytes);
//         const fileName = `${uid}.jpg`;
//         const filePath = path.join(uploadDir, fileName);

//         await writeFile(filePath, buffer);

//         // Simpan ke Database (Tambahkan kolom kelas jika perlu)
//         // Gunakan INSERT OR REPLACE agar jika UID sama, data terupdate
//         db.prepare(
//             "INSERT OR REPLACE INTO siswa (uid, nama, kelas, wa, foto) VALUES (?, ?, ?, ?, ?)",
//         ).run(uid, nama, kelas, wa, `/uploads/${fileName}`);

//         return NextResponse.json({
//             success: true,
//             message: "Siswa berhasil didaftarkan",
//         });
//     } catch (error) {
//         console.error(error);
//         return NextResponse.json(
//             { success: false, message: error.message },
//             { status: 500 },
//         );
//     }
// }
import { NextResponse } from "next/server";
import db from "@/lib/st_db"; // Pastikan path ke db file kamu benar
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request) {
    try {
        const formData = await request.formData();
        const uid = formData.get("uid");
        const nama = formData.get("nama");
        const kelas = formData.get("kelas");
        const wa = formData.get("wa");
        const descriptor = formData.get("descriptor"); // Mendapatkan data koordinat wajah
        const file = formData.get("foto"); // File gambar fisik

        // Validasi data penting
        if (!uid || !nama || !descriptor || !file) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Data tidak lengkap atau wajah belum ter-scan",
                },
                { status: 400 },
            );
        }

        // 1. Pastikan folder uploads ada
        const uploadDir = path.join(process.cwd(), "public/uploads");
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Folder sudah ada
        }

        // 2. Simpan Foto Fisik (UID.jpg)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${uid}.jpg`;
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);
        console.log(`📸 Foto berhasil disimpan: ${fileName}`);

        // 3. Simpan ke Database
        // Kita tidak lagi menyimpan kolom 'foto' karena cukup memanggil ${uid}.jpg
        // Kita simpan string JSON 'descriptor' untuk loading absensi yang cepat
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO siswa (uid, nama, kelas, wa, descriptor) 
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(uid, nama, kelas, wa, descriptor);

        return NextResponse.json({
            success: true,
            message: "Siswa berhasil didaftarkan dengan sidik jari wajah.",
        });
    } catch (error) {
        console.error("API Daftar Error:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 },
        );
    }
}
