import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5190,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4201,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        game: fileURLToPath(new URL('./index.html', import.meta.url)),
        modelReview: fileURLToPath(new URL('./model-review.html', import.meta.url)),
        skillPresentationReview: fileURLToPath(new URL('./skill-presentation-review.html', import.meta.url)),
      },
    },
    // esbuild-minified output intermittently resets Chromium's software WebGL
    // context during the first custom post-processing frames. The unminified
    // bundle is stable and still only about 276 kB over the wire with gzip.
    minify: false,
    sourcemap: true,
    chunkSizeWarningLimit: 900,
  },
});
