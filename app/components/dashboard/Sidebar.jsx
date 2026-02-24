import { useRouter } from "next/navigation";

export default function Sidebar({ activeTab, setActiveTab }) {
    const router = useRouter();
    const menuItems = [
        { id: "rekap", label: "Rekap Absensi", icon: "📋" },
        { id: "siswa", label: "Manajemen Siswa", icon: "👥" },
        { id: "settings", label: "Pengaturan", icon: "⚙️" },
    ];

    const handleLogout = async () => {
        if (confirm("Apakah Anda yakin ingin keluar?")) {
            const res = await fetch("/api/logout", { method: "POST" });
            if (res.ok) {
                router.push("/login");
            }
        }
    };

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-2xl z-20">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-blue-400 tracking-wider">
                    ABSENSI
                </h2>
                <p className="text-xs text-slate-400">Control Panel v1.0</p>
            </div>
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                            activeTab === item.id
                                ? "bg-blue-600 text-white shadow-lg"
                                : "hover:bg-slate-800 text-slate-400"
                        }`}
                    >
                        <span>{item.icon}</span> {item.label}
                    </button>
                ))}
                <button
                    onClick={() => (window.location.href = "/")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                    <span>📸</span> Buka Kamera
                </button>

                <div className="pt-4 mt-10 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all  cursor-pointer"
                    >
                        <span>🚪</span> Keluar Sistem
                    </button>
                </div>
            </nav>
        </aside>
    );
}
