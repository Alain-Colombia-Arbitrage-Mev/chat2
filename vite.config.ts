import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL ?? "https://memory.ancestro.ai";
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
    build: {
      outDir: path.resolve(__dirname, "./dist"),
      emptyOutDir: true,
    },
    server: {
      port: 5000,
      // During development, proxy /api → the configured backend so cookies work
      // on the same origin.
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
