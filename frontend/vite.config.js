// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   optimizeDeps: {
//     include: ["xlsx", "file-saver", "jspdf", "jspdf-autotable"],
//   },
//   build: {
//     commonjsOptions: {
//       include: [/xlsx/, /file-saver/, /jspdf/, /jspdf-autotable/],
//     },
//   },
// });

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
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
