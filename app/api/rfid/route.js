// import { NextResponse } from "next/server";
// import db from "@/lib/db";
// import { sendAbsensiNotif } from "@/lib/messageTemplates";
// import { getWhatsAppClient } from "@/lib/whatsapp";

// // --- HELPER WAKTU ---
// function nowWIB() {
//     return new Date()
//         .toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
//         .replace(" ", "T");
// }

// /**
//  * Menentukan status berdasarkan jam operasional dari DB
//  */
// function getStatusAbsensi(waktuISO, configMasuk, configPulang) {
//     const jamSekarang = waktuISO.slice(11, 16); // HH:MM

//     if (jamSekarang <= configMasuk) return "masuk";
//     if (jamSekarang < configPulang) return "terlambat";
//     return "pulang";
// }

// /**
//  * Menghitung selisih menit keterlambatan
//  */
// function hitungKeterlambatan(waktuISO, configMasuk) {
//     const [jam, menit] = waktuISO.slice(11, 16).split(":").map(Number);
//     const [jm, mm] = configMasuk.split(":").map(Number);

//     const menitMasuk = jm * 60 + mm;
//     const menitDatang = jam * 60 + menit;

//     return Math.max(0, menitDatang - menitMasuk);
// }

// function sudahAbsen(uid, tanggal, status) {
//     return db
//         .prepare(
//             `
//             SELECT 1 FROM absensi
//             WHERE uid = ? AND DATE(waktu) = DATE(?) AND status = ?
//         `,
//         )
//         .get(uid, tanggal, status);
// }

// // --- MAIN API HANDLER ---
// export async function POST(req) {
//     try {
//         const body = await req.json();
//         const { uid, nama, action } = body;

//         // 1. AMBIL KONFIGURASI JAM DARI DATABASE
//         const configMasuk =
//             db
//                 .prepare("SELECT value FROM settings WHERE key = 'jam_masuk'")
//                 .get()?.value || "07:00";
//         const configPulang =
//             db
//                 .prepare("SELECT value FROM settings WHERE key = 'jam_pulang'")
//                 .get()?.value || "15:00";

//         // --- LOGIKA A: SIMPAN ABSENSI (DARI FACE RECOGNITION) ---
//         if (action === "check_in") {
//             const waktu = nowWIB();
//             const tanggal = waktu.slice(0, 10);

//             // Tentukan status berdasarkan config dari DB
//             const status = getStatusAbsensi(waktu, configMasuk, configPulang);

//             // Validasi Double Absen (Masuk/Terlambat dianggap satu kategori 'Kedatangan')
//             if (status === "masuk" || status === "terlambat") {
//                 if (
//                     sudahAbsen(uid, tanggal, "masuk") ||
//                     sudahAbsen(uid, tanggal, "terlambat")
//                 ) {
//                     return NextResponse.json({
//                         ignored: true,
//                         message: "Sudah absen masuk hari ini",
//                     });
//                 }
//             }

//             // Validasi Double Absen (Pulang)
//             if (status === "pulang") {
//                 if (sudahAbsen(uid, tanggal, "pulang")) {
//                     return NextResponse.json({
//                         ignored: true,
//                         message: "Sudah absen pulang hari ini",
//                     });
//                 }
//             }

//             // Hitung menit telat jika statusnya 'terlambat'
//             const telatMenit =
//                 status === "terlambat"
//                     ? hitungKeterlambatan(waktu, configMasuk)
//                     : 0;

//             // Simpan ke Database
//             db.prepare(
//                 `
//                 INSERT INTO absensi (uid, nama, status, waktu, telat_menit)
//                 VALUES (?, ?, ?, ?, ?)
//             `,
//             ).run(uid, nama, status, waktu, telatMenit);

//             console.log(`[✅] Absensi ${status} dicatat: ${nama} (${waktu})`);
//             // --- [BAGIAN BARU: KIRIM WHATSAPP] ---
//             try {
//                 // Ambil data nomor WA siswa dari database
//                 const siswa = db
//                     .prepare("SELECT wa FROM siswa WHERE uid = ?")
//                     .get(uid);

//                 if (siswa && siswa.wa) {
//                     const client = getWhatsAppClient();

//                     // Cek jika WhatsApp sudah login/ready
//                     if (client && client.info) {
//                         await sendAbsensiNotif(client, {
//                             nama: nama,
//                             wa: siswa.wa,
//                             jam: waktu.slice(11, 16),
//                             status:
//                                 status === "terlambat" ? "Terlambat" : "Hadir",
//                             // Logika keterangan yang lebih akurat:
//                             keterangan:
//                                 status === "pulang"
//                                     ? "Absen Pulang"
//                                     : "Absen Masuk",
//                         });
//                         console.log(`[📩] WhatsApp terkirim ke: ${nama}`);
//                     }
//                 }
//             } catch (waError) {
//                 console.error("[-] Gagal kirim WA:", waError.message);
//                 // Kita tidak return error di sini agar absensi di DB tetap dianggap sukses
//             }
//             // --- [AKHIR BAGIAN WHATSAPP] ---
//             return NextResponse.json({ success: true, status, telatMenit });
//         }

//         // --- LOGIKA B: TRIGGER SOCKET (DARI SCAN RFID ARDUINO) ---
//         if (!uid)
//             return NextResponse.json({ error: "No UID" }, { status: 400 });

//         const siswa = db.prepare("SELECT * FROM siswa WHERE uid = ?").get(uid);

//         if (!siswa) {
//             // Jika kartu tidak dikenal, trigger mode pendaftaran
//             global.io?.emit("pendaftaran", { uid });
//             return NextResponse.json({ status: "pendaftaran" });
//         } else {
//             // Jika kartu dikenal, kirim data ke browser untuk mulai Face Recognition
//             global.io?.emit("absensi", { uid: siswa.uid, nama: siswa.nama });
//             return NextResponse.json({ status: "absensi", nama: siswa.nama });
//         }
//     } catch (error) {
//         console.error("🔥 API Error:", error);
//         return NextResponse.json({ error: error.message }, { status: 500 });
//     }
// }

import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sendAbsensiNotif } from "@/lib/messageTemplates";
import { getWhatsAppClient } from "@/lib/whatsapp";

// --- HELPER LOGGING ---
function addLog(tipe, pesan, uid = "-", kelas = "-") {
    try {
        db.prepare(
            "INSERT INTO logs (tipe, pesan, uid, kelas) VALUES (?, ?, ?, ?)",
        ).run(tipe, pesan, uid, kelas);
    } catch (e) {
        console.error("Gagal mencatat log:", e);
    }
}

// --- HELPER WAKTU & STATUS ---
function nowWIB() {
    return new Date()
        .toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
        .replace(" ", "T");
}

function getStatusAbsensi(waktuISO, configMasuk, configPulang) {
    const jam = waktuISO.slice(11, 16);
    if (jam <= configMasuk) return "masuk";
    if (jam < configPulang) return "terlambat";
    return "pulang";
}

function hitungKeterlambatan(waktuISO, configMasuk) {
    const [jam, menit] = waktuISO.slice(11, 16).split(":").map(Number);
    const [jm, mm] = configMasuk.split(":").map(Number);
    return Math.max(0, jam * 60 + menit - (jm * 60 + mm));
}

function sudahAbsen(uid, tanggal, status) {
    return db
        .prepare(
            "SELECT 1 FROM absensi WHERE uid = ? AND DATE(waktu) = DATE(?) AND status = ?",
        )
        .get(uid, tanggal, status);
}

// --- MAIN API ---
export async function POST(req) {
    try {
        const body = await req.json();
        const { uid, nama, action, token } = body;

        const configMasuk =
            db
                .prepare("SELECT value FROM settings WHERE key = 'jam_masuk'")
                .get()?.value || "07:00";
        const configPulang =
            db
                .prepare("SELECT value FROM settings WHERE key = 'jam_pulang'")
                .get()?.value || "15:00";

        // Ambil info siswa untuk log (kelas)
        const infoSiswa = uid
            ? db.prepare("SELECT kelas, nama FROM siswa WHERE uid = ?").get(uid)
            : null;
        const kelasSiswa = infoSiswa?.kelas || "-";

        // --- LOGIKA A: SIMPAN ABSENSI ---
        if (action === "check_in") {
            const validToken = global.activeAbsensiSessions?.get(uid);
            if (!token || token !== validToken) {
                addLog(
                    "ERROR",
                    `${nama}: Ilegal check-in (Token Salah)`,
                    uid,
                    kelasSiswa,
                );
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 403 },
                );
            }

            const waktu = nowWIB();
            const status = getStatusAbsensi(waktu, configMasuk, configPulang);

            if (
                status !== "pulang" &&
                (sudahAbsen(uid, waktu.slice(0, 10), "masuk") ||
                    sudahAbsen(uid, waktu.slice(0, 10), "terlambat"))
            ) {
                addLog(
                    "INFO",
                    `${nama}: Double scan diabaikan`,
                    uid,
                    kelasSiswa,
                );
                return NextResponse.json({ ignored: true });
            }

            const telatMenit =
                status === "terlambat"
                    ? hitungKeterlambatan(waktu, configMasuk)
                    : 0;
            db.prepare(
                "INSERT INTO absensi (uid, nama, status, waktu, telat_menit) VALUES (?, ?, ?, ?, ?)",
            ).run(uid, nama, status, waktu, telatMenit);

            global.activeAbsensiSessions.delete(uid);
            addLog(
                "SUCCESS",
                `${nama}: Melakukan absen (${status})`,
                uid,
                kelasSiswa,
            );

            // WhatsApp Notification (Non-blocking)
            try {
                // Ambil data nomor WA siswa dari database
                const siswa = db
                    .prepare("SELECT wa FROM siswa WHERE uid = ?")
                    .get(uid);

                // Kita tidak return error di sini agar absensi di DB tetap dianggap sukses
                // Cek apakah siswa nya ada dan memiliki nomor WA
                if (siswa && siswa.wa) {
                    const client = getWhatsAppClient();

                    // cek jika WhatsApp sudah login
                    if (client && client.info) {
                        await sendAbsensiNotif(client, {
                            nama,
                            wa: siswa.wa,
                            jam: waktu.slice(11, 16),
                            status:
                                status === "terlambat" ? "Terlambat" : "Hadir",
                            keterangan:
                                status === "pulang"
                                    ? "Absen Pulang"
                                    : "Absen Masuk",
                        });
                        console.log(`[📩] WhatsApp terkirim ke: ${nama}`);
                        addLog(
                            "SUCCESS",
                            `Berhasil Mengirim Notif WA ke ${nama}`,
                            uid,
                            kelasSiswa,
                        );
                    } else {
                        console.log(
                            `[-] Gagal Mengirim Notif WA ke ${nama}: WhatsApp belum login`,
                        );
                        addLog(
                            "WARN",
                            `Gagal Mengirim Notif WA ke ${nama}: WhatsApp belum login`,
                            uid,
                            kelasSiswa,
                        );
                    }
                } else {
                    console.log(
                        `[-] Gagal Mengirim Notif WA ke ${nama}: Nomor WA tidak ditemukan`,
                    );
                    addLog(
                        "WARN",
                        `Gagal Mengirim Notif WA ke ${nama}: Nomor WA tidak ditemukan`,
                        uid,
                        kelasSiswa,
                    );
                }
            } catch (e) {
                console.log(
                    `[-] Gagal Mengirim Notif WA ke ${nama}: ${e.message}`,
                );
                addLog(
                    "WARN",
                    `Gagal Mengirim Notif WA ke ${nama}: ${e.message}`,
                    uid,
                    kelasSiswa,
                );
            }

            return NextResponse.json({ success: true, status, telatMenit });
        }

        // --- LOGIKA B: TRIGGER RFID ---
        if (!infoSiswa) {
            addLog("WARN", `Kartu tidak dikenal`, uid, "-");
            global.io?.emit("pendaftaran", { uid });
            return NextResponse.json({ status: "pendaftaran" });
        } else {
            const sessionToken = Math.random().toString(36).substring(7);
            if (!global.activeAbsensiSessions)
                global.activeAbsensiSessions = new Map();
            global.activeAbsensiSessions.set(uid, sessionToken);

            addLog("INFO", `${infoSiswa.nama}: Scan RFID`, uid, kelasSiswa);
            global.io?.emit("absensi", {
                uid,
                nama: infoSiswa.nama,
                token: sessionToken,
            });
            return NextResponse.json({ status: "absensi" });
        }
    } catch (error) {
        addLog("ERROR", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
