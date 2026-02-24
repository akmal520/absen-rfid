// components/dashboard/WhatsAppSettings.jsx
import { useState, useEffect } from "react";
// import { QRCodeSVG } from "qrcode.react";
import { QRCodeSVG } from "qrcode.react";

export default function WhatsAppSettings() {
    const [status, setStatus] = useState({ isReady: false, qr: null });
    const [loading, setLoading] = useState(true);

    const checkStatus = async () => {
        try {
            const res = await fetch("/api/whatsapp/status");
            const data = await res.json();
            setStatus(data);
        } catch (e) {
            console.error("Gagal cek status WA");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 5000); // Polling tiap 5 detik
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md">
            <h2 className="text-xl font-bold mb-4">Koneksi WhatsApp</h2>

            {status.isReady ? (
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                        <p className="font-bold">WhatsApp Terhubung</p>
                        <p className="text-xs">
                            Sistem siap mengirim notifikasi.
                        </p>
                    </div>
                </div>
            ) : status.qr ? (
                <div className="text-center space-y-4">
                    <p className="text-sm text-slate-500">
                        Scan QR Code ini untuk menghubungkan:
                    </p>
                    <div className="bg-white p-4 border-4 border-slate-100 inline-block rounded-2xl">
                        <QRCodeSVG value={status.qr} size={200} />
                    </div>
                    <p className="text-xs text-amber-600 font-medium animate-pulse italic">
                        Menunggu scan dari aplikasi WhatsApp...
                    </p>
                </div>
            ) : (
                <div className="py-10 text-center text-slate-400">
                    <div className="animate-spin mb-2">🔄</div>
                    Mempersiapkan modul WhatsApp...
                </div>
            )}
        </div>
    );
}
