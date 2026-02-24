"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import FilterSection from "../components/dashboard/FilterSection";
import RekapTable from "../components/dashboard/RekapTable";
import SiswaTable from "../components/dashboard/SiswaTable";
import SettingsForm from "../components/dashboard/SettingForm";
import EditSiswaModal from "../components/dashboard/EditSiswaModal";
import WhatsAppSettings from "../components/dashboard/WhatsAppSettings";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("rekap");
    const [data, setData] = useState([]); // Data Absensi
    const [dataSiswa, setDataSiswa] = useState([]); // Data Master Siswa
    const [loading, setLoading] = useState(true);

    // State untuk Modal Edit
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSiswa, setEditingSiswa] = useState(null);

    // State Filter & Settings
    const [filterKelas, setFilterKelas] = useState("Semua");
    const [jamMasuk, setJamMasuk] = useState("07:00");
    const [jamPulang, setJamPulang] = useState("15:00");

    // State untuk filter tanggal (opsional, bisa ditambahkan di UI nanti)
    const [tglMulai, setTglMulai] = useState("");
    const [tglSelesai, setTglSelesai] = useState("");

    useEffect(() => {
        fetchData();
        fetchSiswa();
        getSettings();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/rekap?tglMulai=${tglMulai}&tglSelesai=${tglSelesai}`,
            );
            const result = await res.json();
            setData(result.rows || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const fetchSiswa = async () => {
        try {
            const res = await fetch("/api/siswa");
            const result = await res.json();
            setDataSiswa(result || []);
        } catch (e) {
            console.error(e);
        }
    };

    // Fungsi buka modal edit
    const openEditModal = (siswa) => {
        setEditingSiswa({ ...siswa }); // Copy data agar tidak langsung merubah state utama
        setIsEditModalOpen(true);
    };

    // Fungsi simpan perubahan edit
    const handleSaveEdit = async () => {
        try {
            const res = await fetch(`/api/siswa/${editingSiswa.uid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nama: editingSiswa.nama,
                    kelas: editingSiswa.kelas,
                    wa: editingSiswa.wa,
                }),
            });
            const result = await res.json();
            if (result.success) {
                alert("Data siswa berhasil diperbarui!");
                setIsEditModalOpen(false);
                fetchSiswa(); // Refresh data
            } else {
                alert("Gagal update: " + result.message);
            }
        } catch (e) {
            alert("Terjadi kesalahan sistem saat update");
        }
    };

    const handleDeleteSiswa = async (uid, nama) => {
        if (
            !confirm(
                `Hapus siswa ${nama}? Seluruh riwayat absen akan ikut terhapus!`,
            )
        )
            return;
        try {
            const res = await fetch(`/api/siswa/${uid}`, { method: "DELETE" });
            if (res.ok) {
                alert("Siswa dihapus");
                fetchSiswa();
            }
        } catch (e) {
            alert("Gagal menghapus");
        }
    };

    const handleDelete = async (uid, tanggal, nama) => {
        if (!confirm(`Hapus data absensi ${nama}?`)) return;
        try {
            const res = await fetch(`/api/absensi/${uid}/${tanggal}`, {
                method: "DELETE",
            });
            if (res.ok) fetchData();
        } catch (error) {
            alert("Error sistem");
        }
    };

    const updateSettings = async () => {
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jamMasuk, jamPulang }),
            });
            if (res.ok) alert("Simpan berhasil!");
        } catch (error) {
            alert("Error sistem");
        }
    };

    const getSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            const result = await res.json();
            setJamMasuk(result.jam_masuk || "07:00");
            setJamPulang(result.jam_pulang || "15:00");
        } catch (e) {
            console.error(e);
        }
    };

    const [isDownloading, setIsDownloading] = useState(false);
    const handleDownloadExcel = () => {
        setIsDownloading(true);
        const params = new URLSearchParams({
            kelas: filterKelas,
            tglMulai: tglMulai,
            tglSelesai: tglSelesai,
        });
        window.location.href = `/api/download-rekap?${params.toString()}`;
        setTimeout(() => setIsDownloading(false), 2000);
    };

    const filteredData = data.filter((row) =>
        filterKelas === "Semua" ? true : row.kelas === filterKelas,
    );
    const filteredSiswa = dataSiswa.filter((row) =>
        filterKelas === "Semua" ? true : row.kelas === filterKelas,
    );
    const daftarKelas = [
        "Semua",
        ...new Set(dataSiswa.map((item) => item.kelas)),
    ];

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans text-gray-800">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="ml-64 flex-1 p-8">
                {activeTab !== "settings" && (
                    <FilterSection
                        activeTab={activeTab}
                        filterKelas={filterKelas}
                        setFilterKelas={setFilterKelas}
                        daftarKelas={daftarKelas}
                        tglMulai={tglMulai}
                        setTglMulai={setTglMulai}
                        tglSelesai={tglSelesai}
                        setTglSelesai={setTglSelesai}
                        onFilter={fetchData}
                        onDownload={handleDownloadExcel}
                    />
                )}

                {activeTab === "rekap" && (
                    <RekapTable
                        data={filteredData}
                        onDelete={handleDelete}
                        jamMasuk={jamMasuk}
                    />
                )}

                {activeTab === "siswa" && (
                    <SiswaTable
                        data={filteredSiswa}
                        onEdit={(s) => {
                            setEditingSiswa(s);
                            setIsEditModalOpen(true);
                        }}
                        onDelete={handleDeleteSiswa}
                    />
                )}

                {activeTab === "settings" && (
                    <div className="space-y-8">
                        <SettingsForm
                            jamMasuk={jamMasuk}
                            setJamMasuk={setJamMasuk}
                            jamPulang={jamPulang}
                            setJamPulang={setJamPulang}
                            onSave={updateSettings}
                        />
                        <WhatsAppSettings />
                    </div>
                )}
            </main>

            {isEditModalOpen && (
                <EditSiswaModal
                    siswa={editingSiswa}
                    setSiswa={setEditingSiswa}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveEdit}
                />
            )}
        </div>
    );
}

// <div className="flex min-h-screen bg-gray-100 font-sans text-gray-800">
//     {/* SIDEBAR */}
//     <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-2xl z-20">
//         <div className="p-6">
//             <h2 className="text-2xl font-bold text-blue-400 tracking-wider">
//                 ABSENSI AI
//             </h2>
//             <p className="text-xs text-slate-400">Control Panel v1.0</p>
//         </div>
//         <nav className="flex-1 px-4 space-y-2 mt-4">
//             <button
//                 onClick={() => {
//                     setActiveTab("rekap");
//                     fetchData();
//                 }}
//                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "rekap" ? "bg-blue-600 text-white shadow-lg" : "hover:bg-slate-800 text-slate-400"}`}
//             >
//                 <span>📋</span> Rekap Absensi
//             </button>
//             <button
//                 onClick={() => {
//                     setActiveTab("siswa");
//                     fetchSiswa();
//                 }}
//                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "siswa" ? "bg-blue-600 text-white shadow-lg" : "hover:bg-slate-800 text-slate-400"}`}
//             >
//                 <span>👥</span> Manajemen Siswa
//             </button>
//             <button
//                 onClick={() => {
//                     setActiveTab("settings");
//                     getSettings();
//                 }}
//                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "settings" ? "bg-blue-600 text-white shadow-lg" : "hover:bg-slate-800 text-slate-400"}`}
//             >
//                 <span>⚙️</span> Pengaturan Jam
//             </button>
//             <button
//                 onClick={() => (window.location.href = "/")}
//                 className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-400"
//             >
//                 <span>📸</span> Buka Kamera
//             </button>
//         </nav>
//     </aside>

//     {/* MAIN CONTENT */}
//     <main className="ml-64 flex-1 p-8">
//         {activeTab !== "settings" && (
//             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 justify-between items-end">
//                 <div>
//                     <h1 className="text-3xl font-bold text-slate-900">
//                         {activeTab === "rekap"
//                             ? "Rekapitulasi"
//                             : "Data Master Siswa"}
//                     </h1>
//                     <p className="text-slate-500">
//                         Kelola data {activeTab} siswa
//                     </p>
//                 </div>
//                 <div>
//                     <label className="block text-xs font-bold text-slate-500 mb-1">
//                         KELAS
//                     </label>
//                     <select
//                         className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
//                         value={filterKelas}
//                         onChange={(e) => setFilterKelas(e.target.value)}
//                     >
//                         {daftarKelas.map((k) => (
//                             <option key={k} value={k}>
//                                 {k}
//                             </option>
//                         ))}
//                     </select>
//                 </div>

//                 <div
//                     className={`grid grid-cols-2 gap-4 ${activeTab === "rekap" ? "" : "opacity-0 pointer-events-none"}`}
//                 >
//                     <div>
//                         <label className="block text-xs font-bold text-slate-500 mb-1">
//                             DARI TANGGAL
//                         </label>
//                         <input
//                             type="date"
//                             className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
//                             value={tglMulai}
//                             onChange={(e) =>
//                                 setTglMulai(e.target.value)
//                             }
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-xs font-bold text-slate-500 mb-1">
//                             SAMPAI TANGGAL
//                         </label>
//                         <input
//                             type="date"
//                             className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
//                             value={tglSelesai}
//                             onChange={(e) =>
//                                 setTglSelesai(e.target.value)
//                             }
//                         />
//                     </div>
//                 </div>

//                 <div className="flex gap-2">
//                     <button
//                         onClick={fetchData} // Refresh data tabel berdasarkan tanggal
//                         className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all"
//                     >
//                         🔍 Filter
//                     </button>

//                     {activeTab === "rekap" && (
//                         <button
//                             onClick={handleDownloadExcel}
//                             className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
//                         >
//                             📥 Excel
//                         </button>
//                     )}
//                 </div>
//             </div>
//         )}

//         {/* TAB REKAP */}
//         {activeTab === "rekap" && (
//             <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
//                 <table className="w-full text-left">
//                     <thead className="bg-slate-50 border-b border-slate-100">
//                         <tr>
//                             <th className="p-5 text-sm font-semibold text-slate-600">
//                                 Nama Siswa
//                             </th>
//                             <th className="p-5 text-sm font-semibold text-slate-600">
//                                 Tanggal
//                             </th>
//                             <th className="p-5 text-sm font-semibold text-slate-600">
//                                 Kelas
//                             </th>
//                             <th className="p-5 text-sm font-semibold text-slate-600 text-center">
//                                 Masuk
//                             </th>
//                             <th className="p-5 text-sm font-semibold text-slate-600 text-center">
//                                 Pulang
//                             </th>
//                             <th className="p-5 text-sm font-semibold text-slate-600">
//                                 Status
//                             </th>
//                             <th className="p-5 text-sm font-semibold text-slate-600">
//                                 Keterangan
//                             </th>
//                             <th className="p-5 text-sm font-semibold text-slate-600 text-center">
//                                 Aksi
//                             </th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-50">
//                         {filteredData.map((row, i) => (
//                             <tr
//                                 key={i}
//                                 className="hover:bg-blue-50/30 transition-colors"
//                             >
//                                 <td className="p-5 font-medium text-slate-900">
//                                     {row.nama}
//                                 </td>
//                                 <td className="p-5 text-slate-600">
//                                     {row.tanggal}
//                                 </td>
//                                 <td className="p-5 text-slate-600">
//                                     {row.kelas}
//                                 </td>
//                                 <td className="p-5 text-center font-mono text-blue-600 font-semibold">
//                                     {row.jam_masuk || "--:--"}
//                                 </td>
//                                 <td className="p-5 text-center font-mono text-orange-600 font-semibold">
//                                     {row.jam_pulang || "--:--"}
//                                 </td>
//                                 <td className="p-5">
//                                     <span
//                                         className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${row.keterangan === "Hadir" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
//                                     >
//                                         {row.keterangan}
//                                     </span>
//                                 </td>
//                                 <td className="p-5 text-slate-600">
//                                     {row.menit_telat > 0
//                                         ? `terlambat ${row.menit_telat} menit`
//                                         : "Tepat waktu"}
//                                 </td>
//                                 <td className="p-5 text-center">
//                                     <button
//                                         onClick={() =>
//                                             handleDelete(
//                                                 row.uid,
//                                                 row.tanggal,
//                                                 row.nama,
//                                             )
//                                         }
//                                         className="text-slate-300 hover:text-red-500"
//                                     >
//                                         🗑️
//                                     </button>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//         )}

//         {/* TAB MANAJEMEN SISWA */}
//         {activeTab === "siswa" && (
//             <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
//                 <table className="w-full text-left">
//                     <thead className="bg-slate-50 border-b border-slate-100">
//                         <tr>
//                             <th className="p-5 text-sm font-semibold text-slate-600">
//                                 UID
//                             </th>
//                             <th className="p-5 text-sm font-semibold text-slate-600">
//                                 Nama
//                             </th>
//                             <th className="p-5 text-sm font-semibold text-slate-600">
//                                 Kelas
//                             </th>
//                             <th className="p-5 text-sm font-semibold text-slate-600">
//                                 No. WhatsApp
//                             </th>
//                             <th className="p-5 text-sm font-semibold text-slate-600 text-center">
//                                 Aksi
//                             </th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-50">
//                         {filteredSiswa.map((siswa, i) => (
//                             <tr
//                                 key={i}
//                                 className="hover:bg-blue-50/30 transition-colors"
//                             >
//                                 <td className="p-5 font-mono text-xs text-slate-400">
//                                     {siswa.uid}
//                                 </td>
//                                 <td className="p-5 font-bold text-slate-900">
//                                     {siswa.nama}
//                                 </td>
//                                 <td className="p-5 text-slate-600">
//                                     {siswa.kelas}
//                                 </td>
//                                 <td className="p-5 text-slate-600">
//                                     {siswa.wa || "-"}
//                                 </td>
//                                 <td className="p-5 text-center flex justify-center gap-4">
//                                     <button
//                                         onClick={() =>
//                                             openEditModal(siswa)
//                                         }
//                                         className="text-blue-500 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all font-bold text-sm"
//                                     >
//                                         ✏️ Edit
//                                     </button>
//                                     <button
//                                         onClick={() =>
//                                             handleDeleteSiswa(
//                                                 siswa.uid,
//                                                 siswa.nama,
//                                             )
//                                         }
//                                         className="text-red-400 hover:bg-red-50 px-3 py-1 rounded-lg transition-all font-bold text-sm"
//                                     >
//                                         🗑️ Hapus
//                                     </button>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//         )}

//         {/* TAB SETTINGS */}
//         {activeTab === "settings" && (
//             <div className="max-w-2xl animate-in slide-in-from-bottom-4">
//                 <h1 className="text-3xl font-bold text-slate-900 mb-2">
//                     Pengaturan Sistem
//                 </h1>
//                 <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6 mt-6">
//                     <div className="grid grid-cols-2 gap-6">
//                         <div>
//                             <label className="block text-sm font-bold text-slate-700 mb-2">
//                                 Batas Jam Masuk
//                             </label>
//                             <input
//                                 type="time"
//                                 value={jamMasuk}
//                                 onChange={(e) =>
//                                     setJamMasuk(e.target.value)
//                                 }
//                                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xl"
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-bold text-slate-700 mb-2">
//                                 Batas Jam Pulang
//                             </label>
//                             <input
//                                 type="time"
//                                 value={jamPulang}
//                                 onChange={(e) =>
//                                     setJamPulang(e.target.value)
//                                 }
//                                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xl"
//                             />
//                         </div>
//                     </div>
//                     <button
//                         onClick={updateSettings}
//                         className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
//                     >
//                         💾 Simpan Konfigurasi
//                     </button>
//                 </div>
//             </div>
//         )}
//     </main>

//     {/* --- MODAL EDIT SISWA --- */}
//     {isEditModalOpen && editingSiswa && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
//             <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
//                 <div className="bg-blue-600 p-6 text-white">
//                     <h3 className="text-xl font-bold">
//                         Edit Data Siswa
//                     </h3>
//                     <p className="text-blue-100 text-sm">
//                         UID: {editingSiswa.uid}
//                     </p>
//                 </div>

//                 <div className="p-8 space-y-5">
//                     <div>
//                         <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
//                             Nama Lengkap
//                         </label>
//                         <input
//                             type="text"
//                             className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//                             value={editingSiswa.nama}
//                             onChange={(e) =>
//                                 setEditingSiswa({
//                                     ...editingSiswa,
//                                     nama: e.target.value,
//                                 })
//                             }
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
//                             Kelas
//                         </label>
//                         <input
//                             type="text"
//                             className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//                             value={editingSiswa.kelas}
//                             onChange={(e) =>
//                                 setEditingSiswa({
//                                     ...editingSiswa,
//                                     kelas: e.target.value,
//                                 })
//                             }
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
//                             Nomor WhatsApp
//                         </label>
//                         <input
//                             type="text"
//                             placeholder="Contoh: 62812345678"
//                             className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
//                             value={editingSiswa.wa || ""}
//                             onChange={(e) =>
//                                 setEditingSiswa({
//                                     ...editingSiswa,
//                                     wa: e.target.value,
//                                 })
//                             }
//                         />
//                     </div>
//                 </div>

//                 <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
//                     <button
//                         onClick={() => setIsEditModalOpen(false)}
//                         className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all"
//                     >
//                         Batal
//                     </button>
//                     <button
//                         onClick={handleSaveEdit}
//                         className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
//                     >
//                         Simpan
//                     </button>
//                 </div>
//             </div>
//         </div>
//     )}
// </div>
