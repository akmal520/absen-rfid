export default function EditSiswaModal({ siswa, setSiswa, onClose, onSave }) {
    if (!siswa) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-blue-600 p-6 text-white">
                    <h3 className="text-xl font-bold">Edit Data Siswa</h3>
                    <p className="text-blue-100 text-sm">UID: {siswa.uid}</p>
                </div>

                <div className="p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                            Nama Lengkap
                        </label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={siswa.nama}
                            onChange={(e) =>
                                setSiswa({ ...siswa, nama: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                            Kelas
                        </label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none"
                            value={siswa.kelas}
                            onChange={(e) =>
                                setSiswa({ ...siswa, kelas: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                            Nomor WhatsApp
                        </label>
                        <input
                            type="text"
                            placeholder="62812xxx"
                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none font-mono"
                            value={siswa.wa || ""}
                            onChange={(e) =>
                                setSiswa({ ...siswa, wa: e.target.value })
                            }
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onSave}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition-all"
                    >
                        Simpan
                    </button>
                </div>
            </div>
        </div>
    );
}
