import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves from /<repo>/, so the workflow sets BASE_PATH=/heimdall/.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
});
