import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Vite expects hostnames here, not full URLs with a protocol.
    allowedHosts: ["taas.runflare.run"],
  },
});
