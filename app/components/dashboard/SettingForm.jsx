export default function SettingsForm({
    jamMasuk,
    setJamMasuk,
    jamPulang,
    setJamPulang,
    onSave,
}) {
    console.log("Rendering SettingsForm with:", { jamMasuk, jamPulang });
    return (
        <div className="max-w-2xl animate-in slide-in-from-bottom-4">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Pengaturan Sistem
            </h1>
            <p className="text-slate-500 mb-6">
                Tentukan batas jam kehadiran untuk perhitungan keterlambatan.
            </p>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">
                            Batas Jam Masuk
                        </label>
                        <input
                            type="time"
                            value={jamMasuk}
                            onChange={(e) => setJamMasuk(e.target.value)}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">
                            Batas Jam Pulang
                        </label>
                        <input
                            type="time"
                            value={jamPulang}
                            onChange={(e) => setJamPulang(e.target.value)}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3 items-start">
                    <span className="text-xl">💡</span>
                    <p className="text-sm text-blue-700">
                        Siswa yang absen setelah <strong>{jamMasuk}</strong>{" "}
                        akan otomatis tercatat sebagai{" "}
                        <strong>"Terlambat"</strong> di sistem rekapitulasi.
                    </p>
                </div>

                <button
                    onClick={onSave}
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all"
                >
                    💾 Simpan Konfigurasi
                </button>
            </div>
        </div>
    );
}
