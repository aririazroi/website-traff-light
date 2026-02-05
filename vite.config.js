import { defineConfig } from 'vite';

// For GitHub Pages: site is at https://username.github.io/REPO_NAME/
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
