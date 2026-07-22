import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes the built files use relative paths, so the site
// works correctly on GitHub Pages no matter what the repo is named.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
