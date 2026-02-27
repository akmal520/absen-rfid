"use client";
import { useEffect, useState } from "react";

export default function LogMonitor() {
    const [logs, setLogs] = useState([]);

    const loadLogs = async () => {
        const res = await fetch("/api/logs");
        const data = await res.json();
        setLogs(data);
    };

    useEffect(() => {
        loadLogs();
        const interval = setInterval(loadLogs, 5000); // refresh tiap 3 detik
        return () => clearInterval(interval);
    }, []);

    const badge = (tipe) => {
        const styles = {
            SUCCESS: "bg-green-100 text-green-700",
            WARN: "bg-yellow-100 text-yellow-700",
            ERROR: "bg-red-100 text-red-700",
            INFO: "bg-blue-100 text-blue-700",
        };
        return (
            <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${styles[tipe]}`}
            >
                {tipe}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-700">Live Activity Log</h3>
                <span className="text-xs text-gray-400 font-mono italic">
                    Auto-clean: 7 days
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                        <tr>
                            <th className="px-4 py-2">Waktu</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Pesan</th>
                            <th className="px-4 py-2">Kelas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map((log) => (
                            <tr
                                key={log.id}
                                className="hover:bg-gray-50 transition"
                            >
                                <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                                    {log.waktu.split(" ")[1]}
                                </td>
                                <td className="px-4 py-3">{badge(log.tipe)}</td>
                                <td className="px-4 py-3 font-medium text-gray-700">
                                    {log.pesan}
                                </td>
                                <td className="px-4 py-3 italic text-gray-500">
                                    {log.kelas}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
