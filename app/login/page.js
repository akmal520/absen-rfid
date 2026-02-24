"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        const res = await fetch("/api/login", {
            method: "POST",
            body: JSON.stringify({ username: user, password: pass }),
        });

        if (res.ok) {
            router.push("/dashboard");
        } else {
            alert("Username atau Password salah!");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 border border-slate-200">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Admin Login
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Sistem Absensi Sekolah
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                            Username
                        </label>
                        <input
                            type="text"
                            className="w-full px-5 py-4 text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => setUser(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                            Password
                        </label>
                        <input
                            type="password"
                            className="w-full px-5 py-4 text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => setPass(e.target.value)}
                            required
                        />
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95">
                        Masuk Sekarang
                    </button>
                </form>
            </div>
        </div>
    );
}
