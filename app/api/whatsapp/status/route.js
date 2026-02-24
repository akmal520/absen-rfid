// /api/whatsapp/status/route.js

import { getWhatsAppClient } from "@/lib/whatsapp";

// import { getWhatsAppClient } from "@/lib/whatsapp";

export async function GET() {
    const client = getWhatsAppClient();

    // Kita simpan QR terakhir di global variable atau cache sederhana
    const qrCode = global.lastQR || null;
    const isReady = client?.info ? true : false;

    return Response.json({
        success: true,
        isReady,
        qr: qrCode,
    });
}
