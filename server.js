const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { cleanupOldLogs } = require("./lib/utils");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    // JALANKAN PEMBERSIHAN SAAT BOOTING
    console.log("[🚀] Server starting... Running maintenance...");
    cleanupOldLogs();
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    // Inisialisasi Socket.io di sini
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    global.io = io; // Agar bisa dipanggil dari API Route Next.js

    io.on("connection", (socket) => {
        console.log("✅ Browser terhubung ke WebSocket");
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});

// "scripts": {
//   "dev": "next dev",
//   "build": "next build",
//   "start": "next start"
// },
