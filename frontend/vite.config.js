// frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      "framer-motion",
      "react",
      "react-dom",
      "xlsx",
      "file-saver",
      "jspdf",
      "jspdf-autotable",
    ],
  },
  build: {
    outDir: "dist",
    commonjsOptions: {
      include: [/xlsx/, /file-saver/, /jspdf/, /jspdf-autotable/],
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
