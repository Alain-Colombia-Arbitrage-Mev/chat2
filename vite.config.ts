import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Proxy target is the backend the dev server forwards `/api/*` to. It must
  // be a real URL even when VITE_API_URL is empty (empty → client uses
  // relative URLs and goes through the proxy).
  const proxyTarget = env.BACKEND_URL || env.VITE_API_URL || "https://memory.ancestro.ai";
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client/src"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
    root: "./client",
    publicDir: path.resolve(__dirname, "./client/public"),
    // env files live next to vite.config.ts, not inside client/
    envDir: __dirname,
    build: {
      outDir: path.resolve(__dirname, "./dist"),
      emptyOutDir: true,
    },
    server: {
      host: "0.0.0.0",
      port: 5000,
      // Vite 5.4.12+ blocks unknown hostnames. Allow the public IP in dev.
      allowedHosts: ["148.113.212.150", "localhost", ".ancestro.ai"],
      // During development, proxy /api → the configured backend so cookies work
      // on the same origin.
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
          // Cookies served by the backend have Domain=.ancestro.ai + Secure.
          // For local dev served over http:// from a different host the
          // browser drops them. Rewrite so they stick on whatever origin the
          // dev server happens to be on.
          cookieDomainRewrite: "",
          cookiePathRewrite: "/",
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              // Backend enforces an Origin allowlist that rejects any value
              // not on its short list — even its own canonical host. Strip
              // Origin and Referer so server-to-server requests look clean.
              proxyReq.removeHeader("origin");
              proxyReq.removeHeader("referer");
            });
            proxy.on("proxyRes", (proxyRes) => {
              const sc = proxyRes.headers["set-cookie"];
              if (!sc) return;
              proxyRes.headers["set-cookie"] = sc.map((c) =>
                c
                  .replace(/;\s*Secure/gi, "")
                  .replace(/SameSite=None/gi, "SameSite=Lax"),
              );
            });
          },
        },
      },
    },
  };
});
