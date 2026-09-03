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
  // Add this: Pre-bundle framer-motion for better resolution
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
    // Add this: Ensure commonjs modules are properly handled
    commonjsOptions: {
      include: [
        /xlsx/,
        /file-saver/,
        /jspdf/,
        /jspdf-autotable/,
        /framer-motion/,
      ],
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // Add this: Help resolve framer-motion correctly
  resolve: {
    alias: {
      // Ensure framer-motion resolves to the correct entry point
      "framer-motion": "framer-motion/dist/es/index.mjs",
    },
  },
});
