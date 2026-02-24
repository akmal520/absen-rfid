import { FaRegTrashAlt } from "react-icons/fa";
export default function RekapTable({ data, onDelete, jamMasuk }) {
    // Fungsi Helper untuk hitung selisih menit
    const hitungMenitTerlambat = (jamAbsen, jamBatas) => {
        if (!jamAbsen || jamAbsen === "--:--") return 0;

        const [hAbsen, mAbsen] = jamAbsen.split(":").map(Number);
        const [hBatas, mBatas] = jamBatas.split(":").map(Number);

        const totalMenitAbsen = hAbsen * 60 + mAbsen;
        const totalMenitBatas = hBatas * 60 + mBatas;

        const selisih = totalMenitAbsen - totalMenitBatas;
        return selisih > 0 ? selisih : 0;
    };
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="p-5 text-sm font-semibold text-slate-600 ">
                            Nama Siswa
                        </th>
                        <th className="p-5 text-sm font-semibold text-slate-600 ">
                            Tanggal
                        </th>
                        <th className="p-5 text-sm font-semibold text-slate-600 text-center">
                            Masuk
                        </th>
                        <th className="p-5 text-sm font-semibold text-slate-600 text-center">
                            Pulang
                        </th>
                        <th className="p-5 text-sm font-semibold text-slate-600 text-center">
                            Status
                        </th>
                        <th className="p-5 text-sm font-semibold text-slate-600 text-center">
                            Keterangan
                        </th>
                        <th className="p-5 text-sm font-semibold text-slate-600 text-center">
                            Aksi
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.length > 0 ? (
                        data.map((row, i) => {
                            const menitTelat = hitungMenitTerlambat(
                                row.jam_masuk,
                                jamMasuk,
                            );

                            return (
                                <tr
                                    key={i}
                                    className="hover:bg-blue-50/30 transition-colors"
                                >
                                    <td className="p-5 font-medium text-slate-900">
                                        {row.nama}
                                    </td>
                                    <td className="p-5 text-slate-600">
                                        {row.tanggal}
                                    </td>
                                    <td className="p-5 text-center font-mono text-green-600 font-semibold">
                                        {row.jam_masuk || "--:--"}
                                    </td>
                                    <td className="p-5 text-center font-mono text-orange-600 font-semibold">
                                        {row.jam_pulang || "--:--"}
                                    </td>
                                    <td className="p-5 text-center">
                                        <span
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold ${row.keterangan === "Hadir" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                        >
                                            {row.keterangan}
                                        </span>
                                    </td>
                                    <td
                                        className={`p-5 text-sm text-center font-bold ${menitTelat > 0 ? "text-red-500" : "text-green-500"}`}
                                    >
                                        {menitTelat > 0
                                            ? `Terlambat ${menitTelat} menit`
                                            : "Tepat waktu"}
                                    </td>
                                    <td className="p-5 text-center">
                                        <button
                                            onClick={() =>
                                                onDelete(
                                                    row.uid,
                                                    row.tanggal,
                                                    row.nama,
                                                )
                                            }
                                            className="text-red-300 hover:text-red-500 transition-colors duration-200"
                                        >
                                            <FaRegTrashAlt size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td
                                colSpan="8"
                                className="p-5 text-center text-slate-600"
                            >
                                Tidak ada data absensi ditemukan.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
