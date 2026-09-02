import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    proxy: {
      "/auth": "http://localhost:8000",
      "/predict": "http://localhost:8000",
      "/keystroke-predict": "http://localhost:8000",
      "/final-predict": "http://localhost:8000",
      "/predictions": "http://localhost:8000",
      "/patients": "http://localhost:8000",
      "/work-queue": "http://localhost:8000",
      "/notifications": "http://localhost:8000",
      "/clinical-assistant": "http://localhost:8000",
      "/model-analytics": "http://localhost:8000",
      "/dashboard": "http://localhost:8000",
      "/reports": "http://localhost:8000",
      "/search": "http://localhost:8000",
      "/audit-log": "http://localhost:8000",
      "/saved-patients": "http://localhost:8000",
      "/profile": "http://localhost:8000",
    },
  },
});