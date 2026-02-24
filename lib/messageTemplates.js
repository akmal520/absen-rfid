// lib/messageTemplates.js
export const sendAbsensiNotif = async (client, dataSiswa) => {
    const { nama, wa, jam, status, keterangan } = dataSiswa;

    if (!wa) return;

    // Tentukan Ikon dan Kalimat berdasarkan keterangan (Masuk/Pulang)
    const isPulang = keterangan.toLowerCase().includes("pulang");
    const header = isPulang
        ? "🔴 *NOTIFIKASI ABSEN PULANG*"
        : "🟢 *NOTIFIKASI ABSEN MASUK*";

    // Tentukan Status (Hadir / Terlambat)
    let statusText = status;
    if (status === "Terlambat") {
        statusText = "🔴 Terlambat";
    } else {
        statusText = "🟢 Tepat Waktu";
    }

    // Susun Pesan secara Reusable
    const message = `
${header}
----------------------------
Nama    : *${nama}*
Jam     : ${jam}
Status  : ${isPulang ? "🟢 Sudah Pulang" : statusText}
Ket.    : ${keterangan}

${
    isPulang
        ? "Siswa telah menyelesaikan kegiatan sekolah dan dalam perjalanan pulang. Hati-hati di jalan!"
        : "Siswa telah sampai di sekolah dengan selamat."
}
_Sistem Absensi AI Sekolah_
    `.trim();

    try {
        const formattedNumber = wa.includes("@c.us") ? wa : `${wa}@c.us`;
        await client.sendMessage(formattedNumber, message);
        console.log(`[WA] Terkirim (${keterangan}): ${nama}`);
    } catch (error) {
        console.error("[WA] Gagal kirim:", error);
    }
};
