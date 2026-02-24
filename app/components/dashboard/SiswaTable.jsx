export default function SiswaTable({ data, onEdit, onDelete }) {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="p-5 text-sm font-semibold text-slate-600">
                            UID
                        </th>
                        <th className="p-5 text-sm font-semibold text-slate-600">
                            Nama
                        </th>
                        <th className="p-5 text-sm font-semibold text-slate-600">
                            Kelas
                        </th>
                        <th className="p-5 text-sm font-semibold text-slate-600">
                            No. WhatsApp
                        </th>
                        <th className="p-5 text-sm font-semibold text-slate-600 text-center">
                            Aksi
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.length > 0 ? (
                        data.map((siswa, i) => (
                            <tr
                                key={i}
                                className="hover:bg-blue-50/30 transition-colors"
                            >
                                <td className="p-5 font-mono text-xs text-slate-400">
                                    {siswa.uid}
                                </td>
                                <td className="p-5 font-bold text-slate-900">
                                    {siswa.nama}
                                </td>
                                <td className="p-5 text-slate-600">
                                    {siswa.kelas}
                                </td>
                                <td className="p-5 text-slate-600">
                                    {siswa.wa || "-"}
                                </td>
                                <td className="p-5 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => onEdit(siswa)}
                                            className="text-blue-500 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all font-bold text-sm"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                onDelete(siswa.uid, siswa.nama)
                                            }
                                            className="text-red-400 hover:bg-red-50 px-3 py-1 rounded-lg transition-all font-bold text-sm"
                                        >
                                            🗑️ Hapus
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="5"
                                className="p-10 text-center text-slate-400"
                            >
                                Tidak ada data siswa ditemukan.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
