import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/Whiteboard-to-Infra/",
  plugins: [react()],
  build: {
    // 👈 ADD THIS BUILD OBJECT
    rollupOptions: {
      output: {
        // This tells Rollup (Vite's bundler) to inline
        // dynamic imports instead of creating new chunks.
        inlineDynamicImports: true,
      },
    },
  },
});
