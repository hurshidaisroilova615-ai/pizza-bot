import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Stamped into the bundle so the panel can say which build is running.
  // Without it there is no way to tell a deploy that has not landed yet
  // from a feature that is missing, and the two look identical.
  define: {
    __BUILD_TIME__: JSON.stringify(
      new Date().toLocaleString("uz-UZ", {
        timeZone: "Asia/Tashkent",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    ),
  },
  server: {
    port: 5174,
    host: true,
  },
});
