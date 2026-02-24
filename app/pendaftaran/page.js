// "use client";

// import { useState, useEffect, useRef, Suspense } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import * as faceapi from "face-api.js";

// function PendaftaranForm() {
//     const [loading, setLoading] = useState(false);
//     const [uidInput, setUidInput] = useState("");
//     const [statusWajah, setStatusWajah] = useState("Mencari wajah...");
//     const [capturedBlob, setCapturedBlob] = useState(null);
//     const [previewUrl, setPreviewUrl] = useState(null);
//     const [modelsLoaded, setModelsLoaded] = useState(false);

//     const videoRef = useRef(null);
//     const router = useRouter();
//     const searchParams = useSearchParams();

//     useEffect(() => {
//         const uid = searchParams.get("uid");
//         if (uid) setUidInput(uid);

//         const loadModels = async () => {
//             try {
//                 const MODEL_URL = "/models";
//                 await Promise.all([
//                     faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
//                     faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
//                 ]);
//                 setModelsLoaded(true);
//                 console.log("✅ Model Face-API Berhasil Dimuat");
//             } catch (err) {
//                 console.error("❌ Gagal memuat model:", err);
//                 setStatusWajah("❌ Gagal memuat model AI");
//             }
//         };
//         loadModels();
//     }, [searchParams]);

//     // Jalankan kamera HANYA setelah model siap
//     useEffect(() => {
//         if (modelsLoaded) {
//             startCamera();
//         }
//         return () => stopCamera();
//     }, [modelsLoaded]);

//     const startCamera = async () => {
//         try {
//             const stream = await navigator.mediaDevices.getUserMedia({
//                 video: { width: 640, height: 480 },
//             });
//             if (videoRef.current) {
//                 videoRef.current.srcObject = stream;
//                 videoRef.current.onplay = () => {
//                     setTimeout(() => {
//                         detectFaceLoop();
//                     }, 1000); // Delay sedikit untuk memastikan video sudah stabil
//                 };
//             }
//         } catch (err) {
//             console.error("Kamera error:", err);
//             setStatusWajah("❌ Tidak dapat mengakses kamera");
//         }
//     };

//     const detectFaceLoop = async () => {
//         // Validasi kritis: Video harus ada, sedang jalan, dan punya data pixel (readyState 4)
//         if (
//             !videoRef.current ||
//             videoRef.current.paused ||
//             videoRef.current.readyState !== 4
//         ) {
//             requestAnimationFrame(detectFaceLoop);
//             return;
//         }

//         const options = new faceapi.TinyFaceDetectorOptions({
//             inputSize: 160, // Gunakan 160 agar lebih ringan dan cepat
//             scoreThreshold: 0.5,
//         });

//         try {
//             const detection = await faceapi.detectSingleFace(
//                 videoRef.current,
//                 options,
//             );

//             if (detection) {
//                 setStatusWajah("✅ Wajah Terdeteksi! Siap simpan.");
//             } else {
//                 setStatusWajah("🔍 Posisikan wajah di depan kamera...");
//             }
//         } catch (error) {
//             console.error("Detection error:", error);
//         }

//         // Terus melooping
//         requestAnimationFrame(detectFaceLoop);
//     };

//     const stopCamera = () => {
//         const stream = videoRef.current?.srcObject;
//         stream?.getTracks().forEach((track) => track.stop());
//     };

//     const captureAndSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);

//         const canvas = document.createElement("canvas");
//         canvas.width = videoRef.current.videoWidth;
//         canvas.height = videoRef.current.videoHeight;
//         canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

//         const blob = await new Promise((resolve) =>
//             canvas.toBlob(resolve, "image/jpeg", 0.9),
//         );

//         const formData = new FormData(e.target);
//         formData.append("foto", blob, `${uidInput}.jpg`);

//         try {
//             const res = await fetch("/api/daftar", {
//                 method: "POST",
//                 body: formData,
//             });
//             const result = await res.json();
//             if (result.success) {
//                 alert("Pendaftaran Berhasil!");
//                 router.push("/");
//             }
//         } catch (error) {
//             alert("Gagal mendaftar");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
//             <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-700">
//                 <div className="text-center mb-6">
//                     <h2 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
//                         Registrasi Siswa
//                     </h2>
//                     <p className="text-slate-400 mt-2">
//                         Kartu UID:{" "}
//                         <span className="font-mono text-blue-400">
//                             {uidInput}
//                         </span>
//                     </p>
//                 </div>

//                 {/* Kamera Section */}
//                 <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-4 border-2 border-slate-700 shadow-inner">
//                     <video
//                         ref={videoRef}
//                         autoPlay
//                         muted
//                         playsInline
//                         className="w-full h-full object-cover scale-x-[-1]"
//                     />
//                     <div className="absolute bottom-4 left-0 right-0 text-center">
//                         <span
//                             className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusWajah.includes("✅") ? "bg-emerald-500" : "bg-blue-600"} shadow-lg`}
//                         >
//                             {statusWajah}
//                         </span>
//                     </div>
//                 </div>

//                 <form onSubmit={captureAndSubmit} className="space-y-4">
//                     <input type="hidden" name="uid" value={uidInput} />

//                     <div className="grid grid-cols-2 gap-4">
//                         <div>
//                             <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
//                                 Nama Lengkap
//                             </label>
//                             <input
//                                 name="nama"
//                                 required
//                                 className="w-full p-3 bg-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
//                                 placeholder="Budi Santoso"
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
//                                 Kelas
//                             </label>
//                             <input
//                                 name="kelas"
//                                 required
//                                 className="w-full p-3 bg-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
//                                 placeholder="XI TKJ 1"
//                             />
//                         </div>
//                     </div>

//                     <div>
//                         <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
//                             WhatsApp Orang Tua
//                         </label>
//                         <input
//                             name="wa"
//                             required
//                             className="w-full p-3 bg-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
//                             placeholder="62812345678"
//                         />
//                     </div>

//                     <button
//                         type="submit"
//                         disabled={loading || !statusWajah.includes("✅")}
//                         className={`w-full py-4 rounded-2xl font-bold transition-all transform active:scale-95 ${
//                             statusWajah.includes("✅")
//                                 ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/40 shadow-xl"
//                                 : "bg-slate-700 text-slate-500 cursor-not-allowed"
//                         }`}
//                     >
//                         {loading
//                             ? "Menyimpan Data..."
//                             : "Konfirmasi & Aktifkan Kartu"}
//                     </button>
//                 </form>
//             </div>
//         </div>
//     );
// }

// export default function PendaftaranPage() {
//     return (
//         <Suspense fallback={<div>Loading Models...</div>}>
//             <PendaftaranForm />
//         </Suspense>
//     );
// }

"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as faceapi from "face-api.js";

function PendaftaranForm() {
    const [loading, setLoading] = useState(false);
    const [uidInput, setUidInput] = useState("");
    const [statusWajah, setStatusWajah] = useState("Memuat AI...");
    const [modelsLoaded, setModelsLoaded] = useState(false);

    const videoRef = useRef(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const uid = searchParams.get("uid");
        if (uid) setUidInput(uid);

        const loadModels = async () => {
            try {
                const MODEL_URL = "/models";
                // WAJIB: Tambahkan faceRecognitionNet untuk mengambil Descriptor
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
                console.log("✅ Semua Model Berhasil Dimuat");
            } catch (err) {
                console.error("❌ Gagal memuat model:", err);
                setStatusWajah("❌ Gagal memuat model AI");
            }
        };
        loadModels();
    }, [searchParams]);

    useEffect(() => {
        if (modelsLoaded) {
            startCamera();
        }
        return () => stopCamera();
    }, [modelsLoaded]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onplay = () => {
                    setTimeout(() => {
                        detectFaceLoop();
                    }, 1000);
                };
            }
        } catch (err) {
            console.error("Kamera error:", err);
            setStatusWajah("❌ Tidak dapat mengakses kamera");
        }
    };

    const detectFaceLoop = async () => {
        if (
            !videoRef.current ||
            videoRef.current.paused ||
            videoRef.current.readyState !== 4
        ) {
            requestAnimationFrame(detectFaceLoop);
            return;
        }

        const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 160,
            scoreThreshold: 0.5,
        });

        try {
            const detection = await faceapi.detectSingleFace(
                videoRef.current,
                options,
            );
            if (detection) {
                setStatusWajah("✅ Wajah Terdeteksi! Siap simpan.");
            } else {
                setStatusWajah("🔍 Posisikan wajah di depan kamera...");
            }
        } catch (error) {
            console.error("Detection error:", error);
        }
        requestAnimationFrame(detectFaceLoop);
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject;
        stream?.getTracks().forEach((track) => track.stop());
    };

    const captureAndSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusWajah("⏳ Mengekstrak sidik jari wajah...");

        try {
            // 1. Ekstraksi Descriptor (Sidik Jari Wajah)
            const detection = await faceapi
                .detectSingleFace(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions(),
                )
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                alert(
                    "Wajah tidak terdeteksi dengan jelas saat pengambilan. Pastikan wajah terlihat penuh.",
                );
                setLoading(false);
                setStatusWajah("✅ Wajah Terdeteksi! Siap simpan.");
                return;
            }

            // 2. Ambil Foto untuk file fisik
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

            const blob = await new Promise((resolve) =>
                canvas.toBlob(resolve, "image/jpeg", 0.9),
            );

            // 3. Masukkan ke FormData
            const formData = new FormData(e.target);
            formData.append("foto", blob, `${uidInput}.jpg`);

            // Konversi Float32Array ke String JSON untuk disimpan di Database
            formData.append(
                "descriptor",
                JSON.stringify(Array.from(detection.descriptor)),
            );

            // 4. Kirim ke Server
            const res = await fetch("/api/daftar", {
                method: "POST",
                body: formData,
            });
            const result = await res.json();

            if (result.success) {
                alert("Pendaftaran Berhasil!");
                router.push("/");
            } else {
                alert("Gagal: " + result.message);
            }
        } catch (error) {
            console.error(error);
            alert("Gagal mendaftar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
            <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-700">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Registrasi Siswa
                    </h2>
                    <p className="text-slate-400 mt-2 font-mono text-sm">
                        Kartu UID:{" "}
                        <span className="text-blue-400">{uidInput}</span>
                    </p>
                </div>

                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-4 border-2 border-slate-700 shadow-inner">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span
                            className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                statusWajah.includes("✅")
                                    ? "bg-emerald-500"
                                    : "bg-blue-600"
                            } shadow-lg transition-colors`}
                        >
                            {statusWajah}
                        </span>
                    </div>
                </div>

                <form onSubmit={captureAndSubmit} className="space-y-4">
                    <input type="hidden" name="uid" value={uidInput} />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                                Nama Lengkap
                            </label>
                            <input
                                name="nama"
                                required
                                className="w-full p-3 bg-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Budi Santoso"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                                Kelas
                            </label>
                            <input
                                name="kelas"
                                required
                                className="w-full p-3 bg-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="XI TKJ 1"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                            WhatsApp Orang Tua
                        </label>
                        <input
                            name="wa"
                            required
                            className="w-full p-3 bg-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="62812345678"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !statusWajah.includes("✅")}
                        className={`w-full py-3 rounded-2xl font-bold transition-all transform active:scale-95 ${
                            statusWajah.includes("✅")
                                ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/40 shadow-xl"
                                : "bg-slate-700 text-slate-500 cursor-not-allowed"
                        }`}
                    >
                        {loading
                            ? "Sedang Memproses..."
                            : "Konfirmasi & Simpan"}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="w-full py-3 rounded-2xl font-bold transition-all transform active:scale-95 bg-red-600 hover:bg-red-500 shadow-red-900/40 shadow-xl"
                    >
                        Batal
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function PendaftaranPage() {
    return (
        <Suspense
            fallback={
                <div className="text-white text-center p-10">
                    Memuat Sistem...
                </div>
            }
        >
            <PendaftaranForm />
        </Suspense>
    );
}
