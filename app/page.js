// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { io } from "socket.io-client";
// import * as faceapi from "face-api.js";

// // --- HELPER FUNCTIONS ---

// // 1. Menghitung Eye Aspect Ratio (EAR) untuk deteksi kedipan
// const getEAR = (eye) => {
//     const v1 = Math.sqrt(
//         Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2),
//     );
//     const v2 = Math.sqrt(
//         Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2),
//     );
//     const h = Math.sqrt(
//         Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2),
//     );
//     return (v1 + v2) / (2.0 * h);
// };

// // 2. Mendeteksi arah wajah (Menoleh Kiri/Kanan)
// const getFaceDirection = (landmarks) => {
//     const nose = landmarks.getNose()[0];
//     const leftCheek = landmarks.getJawOutline()[0];
//     const rightCheek = landmarks.getJawOutline()[16];

//     const distLeft = Math.abs(nose.x - leftCheek.x);
//     const distRight = Math.abs(nose.x - rightCheek.x);
//     const ratio = distLeft / distRight;

//     if (ratio > 2.2) return "Kiri";
//     if (ratio < 0.5) return "Kanan";
//     return "Tengah";
// };

// const speak = (file) => {
//     const audio = new Audio(`/sound/${file}`);
//     audio.play().catch((err) => {
//         console.error("Audio Playback Error:", err);
//     });
// };

// export default function AbsensiPage() {
//     const videoRef = useRef(null);
//     const router = useRouter();

//     const [status, setStatus] = useState("Memuat AI...");
//     const [isCameraActive, setIsCameraActive] = useState(false);
//     const [isProcessing, setIsProcessing] = useState(false);
//     const [challenge, setChallenge] = useState("");

//     const faceMatcherRef = useRef(null);
//     const lastScanRef = useRef({ uid: null, time: 0 });

//     const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
//     const audioRefs = useRef({});

//     useEffect(() => {
//         // Pre-load semua file MP3 agar instan saat diputar
//         audioRefs.current = {
//             berhasil: new Audio("/sounds/berhasil.mp3"),
//             gagal: new Audio("/sounds/gagal.mp3"),
//             kanan: new Audio("/sounds/toleh_kanan.mp3"),
//             kiri: new Audio("/sounds/toleh_kiri.mp3"),
//             wajah_tidak_sesuai: new Audio("/sounds/wajah_tidak_sesuai.mp3"),
//             kedip: new Audio("/sounds/kedip.mp3"),
//             welcome: new Audio("/sounds/welcom.mp3"),
//         };
//     }, []);

//     useEffect(() => {
//         const handleFirstInteraction = () => {
//             if (!isAudioUnlocked) {
//                 // Putar audio "pancingan" agar browser memberikan izin
//                 const pancingan = audioRefs.current.welcome;
//                 if (pancingan) {
//                     pancingan
//                         .play()
//                         .then(() => {
//                             console.log("🔊 Audio Berhasil Di-Unlock!");
//                             setIsAudioUnlocked(true);
//                             // Hapus listener setelah sukses agar tidak boros memori
//                             window.removeEventListener(
//                                 "keydown",
//                                 handleFirstInteraction,
//                             );
//                             window.removeEventListener(
//                                 "mousedown",
//                                 handleFirstInteraction,
//                             );
//                         })
//                         .catch((err) =>
//                             console.log("Menunggu interaksi nyata...", err),
//                         );
//                 }
//             }
//         };

//         // Dengarkan ketikan (RFID) atau klik mouse (Operator)
//         window.addEventListener("keydown", handleFirstInteraction);
//         window.addEventListener("mousedown", handleFirstInteraction);

//         return () => {
//             window.removeEventListener("keydown", handleFirstInteraction);
//             window.removeEventListener("mousedown", handleFirstInteraction);
//         };
//     }, [isAudioUnlocked]);

//     const playSound = (key) => {
//         const sound = audioRefs.current[key];
//         if (sound) {
//             sound.currentTime = 0; // Mulai dari awal jika suara sebelumnya masih jalan
//             sound.play().catch((e) => {
//                 console.error(
//                     `Gagal putar ${key}: Browser memblokir autoplay.`,
//                     e,
//                 );
//             });
//         }
//     };

//     // Tambahkan fungsi ini untuk memanaskan mesin AI tanpa membuka kamera user
//     const warmUpAI = async () => {
//         try {
//             // Buat canvas kecil kosong sebagai pancingan
//             const canvas = document.createElement("canvas");
//             canvas.width = 100;
//             canvas.height = 100;
//             // Lakukan deteksi palsu agar model masuk ke memori
//             await faceapi
//                 .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
//                 .withFaceLandmarks()
//                 .withFaceDescriptor();
//             console.log("🔥 AI sudah panas dan siap!");
//             playSound("welcome");
//         } catch (err) {
//             console.error("AI Warm-up Error:", err);
//         }
//     };

//     useEffect(() => {
//         const init = async () => {
//             try {
//                 await Promise.all([
//                     faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
//                     faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
//                     faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
//                 ]);
//                 await loadKnownFaces();

//                 setStatus("Mengoptimalkan Sistem...");
//                 await warmUpAI();
//                 setStatus("Menunggu scan RFID...");
//             } catch (err) {
//                 console.error("AI Init Error:", err);
//                 setStatus("❌ Gagal memuat AI");
//             }
//         };

//         init();
//         const socket = io();
//         socket.on("absensi", (data) => handleAbsensi(data));
//         socket.on("pendaftaran", ({ uid }) => {
//             const cleanUID = uid
//                 .replace(/\s/g, "")
//                 .replace(/[^a-zA-Z0-9]/g, "");
//             router.push(`/pendaftaran?uid=${cleanUID}`);
//         });

//         return () => socket.disconnect();
//     }, []);

//     const loadKnownFaces = async () => {
//         try {
//             const rows = await fetch("/api/siswa").then((r) => r.json());
//             const descriptors = [];
//             for (const row of rows) {
//                 if (row.descriptor) {
//                     try {
//                         const descArray = new Float32Array(
//                             JSON.parse(row.descriptor),
//                         );
//                         descriptors.push(
//                             new faceapi.LabeledFaceDescriptors(row.uid, [
//                                 descArray,
//                             ]),
//                         );
//                     } catch (e) {
//                         console.warn(`Gagal parse: ${row.uid}`);
//                     }
//                 }
//             }
//             if (descriptors.length > 0) {
//                 faceMatcherRef.current = new faceapi.FaceMatcher(
//                     descriptors,
//                     0.5,
//                 );
//             }
//         } catch (err) {
//             console.error("Dataset error", err);
//         }
//     };

//     // const handleAbsensi = async ({ uid, nama }) => {
//     //     if (isProcessing) return;
//     //     const now = Date.now();
//     //     if (
//     //         uid === lastScanRef.current.uid &&
//     //         now - lastScanRef.current.time < 5000
//     //     )
//     //         return;
//     //     lastScanRef.current = { uid, time: now };

//     //     setIsProcessing(true);
//     //     const randomChallenge = Math.random() > 0.5 ? "Kiri" : "Kanan";
//     //     setChallenge("Menolehlah ke " + randomChallenge);
//     //     setStatus(`Halo ${nama}, Menolehlah ke ${randomChallenge}...`);

//     //     let stream = null;
//     //     try {
//     //         stream = await navigator.mediaDevices.getUserMedia({
//     //             video: {
//     //                 width: { ideal: 640 },
//     //                 height: { ideal: 480 },
//     //                 frameRate: { ideal: 20, max: 30 },
//     //             },
//     //         });
//     //         if (videoRef.current) {
//     //             videoRef.current.srcObject = stream;
//     //             setIsCameraActive(true);
//     //             await new Promise((resolve) => {
//     //                 videoRef.current.onloadedmetadata = () => resolve();
//     //             });
//     //             await videoRef.current.play();
//     //         }

//     //         const startTime = Date.now();
//     //         let hasBlinked = false;
//     //         let hasTurnedHead = false;
//     //         let detection = null;

//     //         while (Date.now() - startTime < 15000) {
//     //             if (!videoRef.current) break;

//     //             detection = await faceapi
//     //                 .detectSingleFace(
//     //                     videoRef.current,
//     //                     new faceapi.TinyFaceDetectorOptions(),
//     //                 )
//     //                 .withFaceLandmarks()
//     //                 .withFaceDescriptor();

//     //             if (detection) {
//     //                 // Cek Arah Wajah
//     //                 const currentDir = getFaceDirection(detection.landmarks);
//     //                 // console.log("Arah Wajah:", currentDir);

//     //                 if (currentDir === randomChallenge) {
//     //                     hasTurnedHead = true;
//     //                     setChallenge("Sekarang kedip");
//     //                 }

//     //                 // Cek Kedipan (Hanya dicek jika sudah menoleh atau sambil menoleh)
//     //                 const ear =
//     //                     (getEAR(detection.landmarks.getLeftEye()) +
//     //                         getEAR(detection.landmarks.getRightEye())) /
//     //                     2;

//     //                 if (ear < 0.27) {
//     //                     hasBlinked = true;
//     //                 }

//     //                 if (hasTurnedHead && !hasBlinked) {
//     //                     setStatus("✅ Sip! Sekarang berkedip...");
//     //                 } else if (hasTurnedHead && hasBlinked) {
//     //                     setStatus("✅ Verifikasi Liveness Berhasil!");
//     //                     break;
//     //                 }
//     //             }
//     //             await new Promise((r) => setTimeout(r, 200));
//     //         }

//     //         if (
//     //             hasTurnedHead &&
//     //             hasBlinked &&
//     //             detection &&
//     //             faceMatcherRef.current
//     //         ) {
//     //             const match = faceMatcherRef.current.findBestMatch(
//     //                 detection.descriptor,
//     //             );
//     //             if (match.label === uid) {
//     //                 setStatus(`✅ Berhasil Absen: ${nama}`);
//     //                 // matikan kamera lebih cepat setelah verifikasi berhasil agar user tidak menunggu lama
//     //                 setTimeout(() => cleanup(stream), 3000);
//     //                 await fetch("/api/rfid", {
//     //                     method: "POST",
//     //                     body: JSON.stringify({ uid, nama, action: "check_in" }),
//     //                 });
//     //             } else {
//     //                 setStatus("❌ Wajah Tidak Sesuai Pemilik Kartu");
//     //                 // matikan kamera lebih cepat jika wajah tidak sesuai agar user tidak menunggu lama
//     //                 setTimeout(() => cleanup(stream), 3000);
//     //             }
//     //         } else {
//     //             setStatus("❌ Gagal Verifikasi (Anti-Fraud Timeout)");
//     //             // matikan kamera lebih cepat jika wajah tidak sesuai agar user tidak menunggu lama
//     //             setTimeout(() => cleanup(stream), 3000);
//     //         }

//     //         setTimeout(() => cleanup(stream), 3000);
//     //     } catch (err) {
//     //         console.error(err);
//     //         setIsProcessing(false);
//     //         setStatus("❌ Kamera Bermasalah");
//     //         if (stream) cleanup(stream);
//     //     }
//     // };

//     const handleAbsensi = async ({ uid, nama }) => {
//         if (isProcessing) return;
//         setIsProcessing(true);

//         const randomChallenge = Math.random() > 0.5 ? "Kiri" : "Kanan";
//         setChallenge("Menolehlah ke " + randomChallenge);
//         setStatus(`Halo ${nama}, Menolehlah ke ${randomChallenge}...`);

//         if (randomChallenge === "Kiri") {
//             console.log("Challenge: Menoleh Kiri");
//             playSound("kiri");
//         } else {
//             console.log("Challenge: Menoleh Kanan");
//             playSound("kanan");
//         }

//         let stream = null;
//         try {
//             stream = await navigator.mediaDevices.getUserMedia({
//                 video: { width: 640, height: 480, frameRate: 15 }, // Turunkan FPS ke 15
//             });

//             if (videoRef.current) {
//                 videoRef.current.srcObject = stream;
//                 setIsCameraActive(true);
//                 await videoRef.current.play();
//             }

//             const startTime = Date.now();
//             let hasBlinked = false;
//             let hasTurnedHead = false;
//             let spokenTurned = false;
//             let finalDetection = null;

//             while (Date.now() - startTime < 15000) {
//                 if (!videoRef.current) break;

//                 // STRATEGI PERFORMA: Hanya deteksi wajah + landmarks (TIDAK menghitung descriptor di dalam loop)
//                 const detection = await faceapi
//                     .detectSingleFace(
//                         videoRef.current,
//                         new faceapi.TinyFaceDetectorOptions(),
//                     )
//                     .withFaceLandmarks();

//                 if (detection) {
//                     // 1. Cek Menoleh
//                     const currentDir = getFaceDirection(detection.landmarks);
//                     if (currentDir === randomChallenge) {
//                         hasTurnedHead = true;
//                     }

//                     // 2. Cek Berkedip
//                     const ear =
//                         (getEAR(detection.landmarks.getLeftEye()) +
//                             getEAR(detection.landmarks.getRightEye())) /
//                         2;
//                     if (ear < 0.27) hasBlinked = true;

//                     if (hasTurnedHead && !hasBlinked && !spokenTurned) {
//                         setStatus("✅ Bagus! Sekarang berkedip...");
//                         setChallenge("Sekarang kedip");
//                         playSound("kedip");
//                         spokenTurned = true;
//                     } else if (hasTurnedHead && hasBlinked) {
//                         setStatus("⌛ Memverifikasi Identitas...");

//                         // 3. RECOGNITION HANYA SEKALI (Saat liveness sudah lolos)
//                         finalDetection = await faceapi
//                             .detectSingleFace(
//                                 videoRef.current,
//                                 new faceapi.TinyFaceDetectorOptions(),
//                             )
//                             .withFaceLandmarks()
//                             .withFaceDescriptor();
//                         break;
//                     }
//                 }
//                 // Beri jeda lebih lama agar CPU bisa "napas"
//                 await new Promise((r) => setTimeout(r, 200));
//             }

//             if (finalDetection && faceMatcherRef.current) {
//                 const match = faceMatcherRef.current.findBestMatch(
//                     finalDetection.descriptor,
//                 );
//                 if (match.label === uid) {
//                     const successMessage = `Absen Berhasil. Terima Kasih ${nama}`;
//                     setStatus(`✅ ${successMessage}`);
//                     playSound("berhasil");
//                     setTimeout(() => cleanup(stream), 3000);
//                     await fetch("/api/rfid", {
//                         method: "POST",
//                         body: JSON.stringify({ uid, nama, action: "check_in" }),
//                     });
//                 } else {
//                     playSound("wajah_tidak_sesuai");
//                     setStatus("❌ Wajah Tidak Sesuai!");
//                     setTimeout(() => cleanup(stream), 3000);
//                 }
//             } else {
//                 playSound("gagal");
//                 setStatus("❌ Gagal: Verifikasi tidak lengkap.");
//                 setTimeout(() => cleanup(stream), 3000);
//             }

//             setTimeout(() => cleanup(stream), 3000);
//         } catch (err) {
//             setStatus("❌ Kamera Bermasalah");
//             if (stream) cleanup(stream);
//         }
//     };

//     const cleanup = (stream) => {
//         if (stream) stream.getTracks().forEach((t) => t.stop());
//         setIsCameraActive(false);
//         setIsProcessing(false);
//         setChallenge("");
//         setStatus("Menunggu scan RFID...");
//     };

//     return (
//         <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
//             <div className="mb-6 text-center">
//                 <h1 className="text-3xl font-bold text-blue-400">
//                     Sistem Absensi RFID
//                 </h1>
//                 <p className="text-slate-400 mt-2 font-mono h-6">{status}</p>
//             </div>

//             <div className="relative w-full max-w-2xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800">
//                 <video
//                     ref={videoRef}
//                     autoPlay
//                     muted
//                     playsInline
//                     className={`w-full h-full object-cover transition-opacity duration-700 ${isCameraActive ? "opacity-100" : "opacity-0"} -scale-x-100`}
//                 />

//                 {!isCameraActive && (
//                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
//                         <span className="text-6xl mb-4">📸</span>
//                         <p className="animate-pulse tracking-widest uppercase text-sm">
//                             Standby Mode
//                         </p>
//                     </div>
//                 )}

//                 {isProcessing && isCameraActive && (
//                     <div className="absolute inset-0 pointer-events-none">
//                         <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 animate-scan"></div>
//                         {challenge && (
//                             <div className="absolute top-4 right-4 bg-blue-600 px-4 py-2 rounded-full text-sm font-bold animate-bounce">
//                                 Tantangan: {challenge}
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </div>
//             {/* button to dashboard */}
//             <button
//                 onClick={() => router.push("/dashboard")}
//                 className="cursor-pointer mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full font-bold transition-all transform active:scale-95 shadow-blue-900/40 shadow-xl"
//             >
//                 Dashboard
//             </button>
//             <style jsx>{`
//                 @keyframes scan {
//                     0% {
//                         top: 0;
//                     }
//                     100% {
//                         top: 100%;
//                     }
//                 }
//                 .animate-scan {
//                     position: absolute;
//                     animation: scan 2s linear infinite;
//                 }
//             `}</style>
//         </div>
//     );
// }

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import * as faceapi from "face-api.js";
import { FaRegAddressCard } from "react-icons/fa6";

// --- HELPER FUNCTIONS ---
const getEAR = (eye) => {
    const v1 = Math.sqrt(
        Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2),
    );
    const v2 = Math.sqrt(
        Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2),
    );
    const h = Math.sqrt(
        Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2),
    );
    return (v1 + v2) / (2.0 * h);
};

const getFaceRatio = (landmarks) => {
    const nose = landmarks.getNose()[0];
    const leftCheek = landmarks.getJawOutline()[0];
    const rightCheek = landmarks.getJawOutline()[16];
    return Math.abs(nose.x - leftCheek.x) / Math.abs(nose.x - rightCheek.x);
};

export default function AbsensiPage() {
    const videoRef = useRef(null);
    const router = useRouter();

    const DEFAULT_CONFIG = {
        blink: 0.27,
        yawKiri: 2.2,
        yawKanan: 0.5,
        distance: 0.5,
    };

    const [status, setStatus] = useState("Memuat AI...");
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [challenge, setChallenge] = useState("");
    const [aiConfig, setAiConfig] = useState(DEFAULT_CONFIG);
    const [showDevPanel, setShowDevPanel] = useState(false);
    const [realTimeStats, setRealTimeStats] = useState({ ear: 0, ratio: 1 });

    const faceMatcherRef = useRef(null);
    const audioRefs = useRef({});
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

    // 1. state untuk simpan data siswa
    const [siswaData, setSiswaData] = useState([]);

    // 1. Inisialisasi Config & Audio
    useEffect(() => {
        const saved = localStorage.getItem("ai_config");
        if (saved) setAiConfig(JSON.parse(saved));

        audioRefs.current = {
            berhasil: new Audio("/sounds/berhasil.mp3"),
            gagal: new Audio("/sounds/gagal.mp3"),
            kanan: new Audio("/sounds/toleh_kanan.mp3"),
            kiri: new Audio("/sounds/toleh_kiri.mp3"),
            wajah_tidak_sesuai: new Audio("/sounds/wajah_tidak_sesuai.mp3"),
            kedip: new Audio("/sounds/kedip.mp3"),
            welcome: new Audio("/sounds/welcom.mp3"),
        };
    }, []);

    const updateConfig = (key, value) => {
        const newConfig = { ...aiConfig, [key]: parseFloat(value) };
        setAiConfig(newConfig);
        localStorage.setItem("ai_config", JSON.stringify(newConfig));
    };

    // 2. AI Warm-up & Socket Logic (Pendaftaran vs Absensi)
    useEffect(() => {
        const warmUpAI = async () => {
            const canvas = document.createElement("canvas");
            canvas.width = 100;
            canvas.height = 100;
            await faceapi
                .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
            console.log("🔥 AI Warmer Ready");
        };

        const init = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
                    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
                    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
                ]);
                await loadKnownFaces();
                await warmUpAI();
                setStatus("Menunggu scan RFID...");
                playSound("welcome");
            } catch (err) {
                setStatus("❌ Gagal memuat AI");
            }
        };

        init();
        const socket = io();

        // LOGIKA UTAMA: Bedakan event absensi dan pendaftaran
        socket.on("absensi", (data) => handleAbsensi(data));

        socket.on("pendaftaran", ({ uid }) => {
            const cleanUID = uid
                .replace(/\s/g, "")
                .replace(/[^a-zA-Z0-9]/g, "");
            setStatus("Kartu belum terdaftar, mengalihkan...");
            setTimeout(() => {
                router.push(`/pendaftaran?uid=${cleanUID}`);
            }, 1500);
        });

        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        // Fungsi ini hanya memperbarui pencocok wajah di memori
        // const refreshMatcher = async () => {
        //     if (faceMatcherRef.current) {
        //         console.log(
        //             "Updating FaceMatcher with new distance:",
        //             aiConfig.distance,
        //         );
        //         await loadKnownFaces();
        //     }
        // };
        // refreshMatcher();
        if (siswaData.length > 0) {
            updateFaceMatcher(siswaData);
            console.log(
                "Updating FaceMatcher with new distance:",
                aiConfig.distance,
            );
        }
    }, [aiConfig.distance]); // <--- Slider hanya mentrigger ini

    const loadKnownFaces = async () => {
        try {
            const rows = await fetch("/api/siswa").then((r) => r.json());
            setSiswaData(rows);
            updateFaceMatcher(rows);
            // const descriptors = rows
            //     .filter((r) => r.descriptor)
            //     .map(
            //         (row) =>
            //             new faceapi.LabeledFaceDescriptors(row.uid, [
            //                 new Float32Array(JSON.parse(row.descriptor)),
            //             ]),
            //     );

            // if (descriptors.length > 0)
            //     faceMatcherRef.current = new faceapi.FaceMatcher(
            //         descriptors,
            //         aiConfig.distance,
            //     );
        } catch (err) {
            console.error("Dataset error", err);
        }
    };

    const updateFaceMatcher = (data) => {
        const descriptors = data
            .filter((r) => r.descriptor)
            .map(
                (row) =>
                    new faceapi.LabeledFaceDescriptors(row.uid, [
                        new Float32Array(JSON.parse(row.descriptor)),
                    ]),
            );
        if (descriptors.length > 0)
            faceMatcherRef.current = new faceapi.FaceMatcher(
                descriptors,
                aiConfig.distance,
            );
    };

    const playSound = (key) => {
        const sound = audioRefs.current[key];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    };

    // 3. CORE LOGIC: Liveness + Recognition
    const handleAbsensi = async ({ uid, nama }) => {
        if (isProcessing) return;
        setIsProcessing(true);

        const randomChallenge = Math.random() > 0.5 ? "Kiri" : "Kanan";
        setChallenge(randomChallenge);
        setStatus(`Halo ${nama}, Menoleh ke ${randomChallenge}...`);
        playSound(randomChallenge === "Kiri" ? "kiri" : "kanan");

        let stream = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, frameRate: 15 },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
                await videoRef.current.play();
            }

            const startTime = Date.now();
            let hasBlinked = false;
            let hasTurnedHead = false;
            let spokenTurned = false;
            let finalDetection = null;

            while (Date.now() - startTime < 15000) {
                if (!videoRef.current) break;

                const detection = await faceapi
                    .detectSingleFace(
                        videoRef.current,
                        new faceapi.TinyFaceDetectorOptions(),
                    )
                    .withFaceLandmarks();

                // if (detection) {
                //     const ear =
                //         (getEAR(detection.landmarks.getLeftEye()) +
                //             getEAR(detection.landmarks.getRightEye())) /
                //         2;
                //     const ratio = getFaceRatio(detection.landmarks);

                //     setRealTimeStats({
                //         ear: ear.toFixed(3),
                //         ratio: ratio.toFixed(2),
                //     });

                //     // Logika Toleh
                //     if (
                //         (ratio > aiConfig.yawKiri &&
                //             randomChallenge === "Kiri") ||
                //         (ratio < aiConfig.yawKanan &&
                //             randomChallenge === "Kanan")
                //     ) {
                //         hasTurnedHead = true;
                //     }

                //     // Logika Kedip
                //     if (ear < aiConfig.blink) hasBlinked = true;

                //     if (hasTurnedHead && !hasBlinked && !spokenTurned) {
                //         setStatus("✅ Bagus! Sekarang berkedip...");
                //         setChallenge("Kedip");
                //         playSound("kedip");
                //         spokenTurned = true;
                //     } else if (hasTurnedHead && hasBlinked) {
                //         setStatus("⌛ Memverifikasi...");
                //         finalDetection = await faceapi
                //             .detectSingleFace(
                //                 videoRef.current,
                //                 new faceapi.TinyFaceDetectorOptions(),
                //             )
                //             .withFaceLandmarks()
                //             .withFaceDescriptor();
                //         break;
                //     }
                // }

                // Logika Realtime
                if (detection) {
                    const ear =
                        (getEAR(detection.landmarks.getLeftEye()) +
                            getEAR(detection.landmarks.getRightEye())) /
                        2;
                    const ratio = getFaceRatio(detection.landmarks);

                    setRealTimeStats({
                        ear: ear.toFixed(3),
                        ratio: ratio.toFixed(2),
                    });

                    // TAHAP 1: TOLEH
                    if (!hasTurnedHead) {
                        if (
                            (ratio > aiConfig.yawKiri &&
                                randomChallenge === "Kiri") ||
                            (ratio < aiConfig.yawKanan &&
                                randomChallenge === "Kanan")
                        ) {
                            hasTurnedHead = true;
                            setStatus("✅ Bagus! Sekarang berkedip...");
                            setChallenge("Kedip");
                            playSound("kedip");

                            // Delay 1 detik agar wajah kembali menghadapi kamera
                            await new Promise((r) => setTimeout(r, 1000));
                        }
                    } else if (!hasBlinked) {
                        if (ear < aiConfig.blink) {
                            hasBlinked = true;
                            setStatus("⌛ Memverifikasi...");
                            setChallenge("Selesai");
                        }
                    } else {
                        finalDetection = await faceapi
                            .detectSingleFace(
                                videoRef.current,
                                new faceapi.TinyFaceDetectorOptions(),
                            )
                            .withFaceLandmarks()
                            .withFaceDescriptor();
                        break;
                    }
                }
                await new Promise((r) => setTimeout(r, 150));
            }

            if (finalDetection && faceMatcherRef.current) {
                const match = faceMatcherRef.current.findBestMatch(
                    finalDetection.descriptor,
                );
                if (match.label === uid) {
                    setStatus(`✅ Berhasil: ${nama}`);
                    playSound("berhasil");
                    await fetch("/api/rfid", {
                        method: "POST",
                        body: JSON.stringify({ uid, nama, action: "check_in" }),
                    });
                } else {
                    setStatus("❌ Wajah Tidak Sesuai!");
                    playSound("wajah_tidak_sesuai");
                }
            } else {
                setStatus("❌ Gagal Verifikasi.");
                playSound("gagal");
            }
        } catch (err) {
            setStatus("❌ Kamera Bermasalah");
        }
        setTimeout(() => cleanup(stream), 3000);
    };

    const cleanup = (stream) => {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        setIsCameraActive(false);
        setIsProcessing(false);
        setChallenge("");
        setStatus("Menunggu scan RFID...");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 font-sans">
            {/* Header */}
            <div className="mb-6 text-center">
                <h1 className="text-3xl font-bold text-blue-400">
                    Sistem Absensi
                </h1>
                <p className="text-slate-400 mt-2 font-mono h-6">{status}</p>
            </div>

            {/* Video Container */}
            <div className="relative w-full max-w-2xl aspect-video bg-black rounded-4xl overflow-hidden shadow-2xl border-4 border-slate-800">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-700 ${isCameraActive ? "opacity-100" : "opacity-0"} -scale-x-100`}
                />

                {!isCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
                        <span className="text-6xl mb-2">
                            <FaRegAddressCard size={60} />
                        </span>
                        <p className="tracking-widest uppercase text-xs">
                            Silahkan Scan Kartu
                        </p>
                    </div>
                )}

                {isProcessing && isCameraActive && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 animate-scan"></div>
                        {challenge && (
                            <div className="absolute top-6 right-6 bg-blue-600 px-6 py-2 rounded-full text-sm font-black shadow-lg animate-bounce">
                                MISI: {challenge.toUpperCase()}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button
                onClick={() => router.push("/dashboard")}
                className="cursor-pointer mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full font-bold transition-all transform active:scale-95 shadow-blue-900/40 shadow-xl"
            >
                Ke Dashboard
            </button>

            {/* --- ADMIN DEBUG PANEL --- */}
            <button
                onClick={() => setShowDevPanel(!showDevPanel)}
                className="fixed bottom-4 right-4 p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-xs opacity-30 hover:opacity-100"
            >
                ⚙️ Kalibrasi AI
            </button>

            {showDevPanel && (
                <div className="fixed top-4 right-4 w-72 bg-slate-800/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl z-100 border border-white/10">
                    <h3 className="text-blue-400 font-bold text-xs mb-4 tracking-tighter uppercase">
                        AI Technical Tuning
                    </h3>

                    <div className="grid grid-cols-2 gap-2 mb-6">
                        <div className="bg-black/30 p-2 rounded-xl text-center">
                            <p className="text-[10px] text-slate-500">
                                LIVE EAR
                            </p>
                            <p
                                className={`font-mono font-bold ${realTimeStats.ear < aiConfig.blink ? "text-green-400" : "text-white"}`}
                            >
                                {realTimeStats.ear}
                            </p>
                        </div>
                        <div className="bg-black/30 p-2 rounded-xl text-center">
                            <p className="text-[10px] text-slate-500">
                                LIVE RATIO
                            </p>
                            <p className="font-mono font-bold text-white">
                                {realTimeStats.ratio}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5 text-[11px]">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-slate-400">
                                    Sensitivitas Kedip
                                </label>
                                <span className="text-blue-400">
                                    {aiConfig.blink}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="0.4"
                                step="0.01"
                                value={aiConfig.blink}
                                onChange={(e) =>
                                    updateConfig("blink", e.target.value)
                                }
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none accent-blue-500"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-slate-400">
                                    Threshold Toleh Kiri
                                </label>
                                <span className="text-blue-400">
                                    {aiConfig.yawKiri}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="3.5"
                                step="0.1"
                                value={aiConfig.yawKiri}
                                onChange={(e) =>
                                    updateConfig("yawKiri", e.target.value)
                                }
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none accent-blue-500"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-slate-400">
                                    Threshold Toleh Kanan
                                </label>
                                <span className="text-blue-400">
                                    {aiConfig.yawKanan}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="3.5"
                                step="0.1"
                                value={aiConfig.yawKanan}
                                onChange={(e) =>
                                    updateConfig("yawKanan", e.target.value)
                                }
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none accent-blue-500"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-slate-400">
                                    Akurasi Wajah (Dist)
                                </label>
                                <span className="text-blue-400">
                                    {aiConfig.distance}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.3"
                                max="0.7"
                                step="0.01"
                                value={aiConfig.distance}
                                onChange={(e) =>
                                    updateConfig("distance", e.target.value)
                                }
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none accent-blue-500"
                            />
                        </div>

                        <button
                            onClick={() => {
                                localStorage.removeItem("ai_config");
                                setAiConfig(DEFAULT_CONFIG);
                            }}
                            className="w-full py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                            Reset ke Default
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes scan {
                    0% {
                        top: 0;
                    }
                    100% {
                        top: 100%;
                    }
                }
                .animate-scan {
                    position: absolute;
                    animation: scan 2s linear infinite;
                }
            `}</style>
        </div>
    );
}
