import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  build: {
    target: "es2022",
    cssTarget: "chrome111",
    // Keep the 3D engine and the admin dashboard out of the critical path.
    // An article page should never download three.js.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "engine-three";
          if (id.includes("@react-three") || id.includes("postprocessing")) return "engine-r3f";
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) return "react";
          return undefined;
        },
      },
    },
  },
});
