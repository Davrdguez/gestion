// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import VitePWA from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "FinBox",
          short_name: "FinBox",
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#1d4ed8",
          icons: [
            {
              src: "/logo.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/logo2.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
    ],
  },

  integrations: [react()],
});
