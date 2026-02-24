/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    reactCompiler: true,
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals.push({
                puppeteer: "commonjs puppeteer",
                "whatsapp-web.js": "commonjs whatsapp-web.js",
            });
        }
        return config;
    },
};

export default nextConfig;
