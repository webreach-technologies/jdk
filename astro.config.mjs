// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  vite: {
      plugins: [tailwindcss()],
  },

  // site: 'https://jdktransportation.com', // For development, you can use a placeholder URL. Make sure to update it to the actual URL when deploying.
  site: 'https://webreach-technologies.github.io', // testing with GitHub Pages
  base: '/jdk', // Set the base path for GitHub Pages deployment
  integrations: [sitemap()],
});