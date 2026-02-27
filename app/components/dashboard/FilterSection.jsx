export default function FilterSection({
    activeTab,
    filterKelas,
    setFilterKelas,
    daftarKelas,
    tglMulai,
    setTglMulai,
    tglSelesai,
    setTglSelesai,
    onFilter,
    onDownload,
    onDeleteLogs,
}) {
    const safeDaftarKelas = Array.isArray(daftarKelas)
        ? daftarKelas
        : ["Semua"];
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                    {activeTab === "rekap"
                        ? "Rekapitulasi"
                        : activeTab === "siswa"
                          ? "Data Master Siswa"
                          : "Log Aktivitas Sistem"}
                </h1>
                <p className="text-slate-500">Kelola data {activeTab} siswa</p>
            </div>

            <div className="flex flex-wrap gap-4 items-end">
                {/* Filter Kelas */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                        Kelas
                    </label>
                    <select
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterKelas}
                        onChange={(e) => setFilterKelas(e.target.value)}
                    >
                        {daftarKelas.map((k) => (
                            <option key={k} value={k}>
                                {k}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filter Tanggal (Hanya muncul di Tab Rekap) */}
                {activeTab === "rekap" && (
                    <>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                                Dari
                            </label>
                            <input
                                type="date"
                                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                                value={tglMulai}
                                onChange={(e) => setTglMulai(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                                Sampai
                            </label>
                            <input
                                type="date"
                                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                                value={tglSelesai}
                                onChange={(e) => setTglSelesai(e.target.value)}
                            />
                        </div>
                    </>
                )}

                {/* Tombol Aksi */}
                {activeTab === "rekap" && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onFilter()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all"
                        >
                            🔍 Filter
                        </button>
                        <button
                            onClick={onDownload}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
                        >
                            📥 Excel
                        </button>
                    </div>
                )}
                {activeTab === "log" && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onDeleteLogs()}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-all"
                        >
                            🗑️ Hapus Log
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
