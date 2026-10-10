import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Simple Vite config. Port 5173 is the default `npm run dev` URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
