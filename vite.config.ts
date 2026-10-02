import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the site from /solar-system-3d/; dev server stays at /
  base: command === 'build' ? '/solar-system-3d/' : '/',
  plugins: [tailwindcss()],
  server: {
    port: 3000,
    open: false
  },
  build: {
    target: 'esnext'
  }
}));
