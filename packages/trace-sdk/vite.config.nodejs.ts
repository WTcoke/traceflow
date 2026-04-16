import { defineConfig } from 'vite';
import { resolve } from 'path';

// Node.js 内置模块，不打包进产物，运行时 require
const nodeBuiltins = [
  'os',
  'crypto',
  'fs',
  'path',
  'http',
  'https',
  'util',
  'url',
  'buffer',
  'stream',
  'zlib',
];

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'entry-nodejs.ts'),
      formats: ['cjs', 'es'],
      fileName: (format: string) => `trace-sdk.nodejs.${format}.js`,
    },
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: nodeBuiltins,
      output: {},
    },
    target: 'node14',
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
