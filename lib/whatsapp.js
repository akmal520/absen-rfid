// lib/whatsapp.js
import { Client, LocalAuth } from "whatsapp-web.js";

// Mencegah inisialisasi ganda saat Hot Reload di Next.js
let client = global.whatsappClient || null;

export const getWhatsAppClient = () => {
    if (!client) {
        console.log("[WA] Memulai Client Baru...");

        client = new Client({
            authStrategy: new LocalAuth({
                clientId: "absensi-ai", // Folder session unik
            }),
            puppeteer: {
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
                handleSIGINT: false, // Menghindari crash saat proses berhenti
                handleSIGTERM: false,
            },
        });

        client.on("qr", (qr) => {
            global.lastQR = qr;
            console.log("[WA] QR Received - Silahkan cek dashboard");
        });

        client.on("ready", () => {
            global.lastQR = null;
            console.log("[WA] WhatsApp Ready!");
        });

        client.on("auth_failure", (msg) => {
            console.error("[WA] Auth Failure:", msg);
            global.lastQR = null;
        });

        client.on("disconnected", (reason) => {
            console.log("[WA] Terputus:", reason);
            global.lastQR = null;
            // Penting: Jangan langsung initialize di sini untuk menghindari loop crash
            client.destroy().then(() => {
                global.whatsappClient = null;
                client = null;
            });
        });

        client
            .initialize()
            .catch((err) => console.error("[WA] Init Error:", err));

        // Simpan ke global agar tidak dibuat ulang saat Hot Reload
        global.whatsappClient = client;
    }

    return client;
};
