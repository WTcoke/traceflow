import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'entry-web.ts'),
      name: 'TraceSDK',
      formats: ['iife', 'es', 'cjs'],
      fileName: (format: string) => `trace-sdk.web.${format}.js`,
    },
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        name: 'TraceSDK',
      },
    },
    target: 'es2015',
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Web 构建中将 Node.js 内置模块替换为空模块
      os: resolve(__dirname, 'src/adapter/empty-module.ts'),
      crypto: resolve(__dirname, 'src/adapter/empty-module.ts'),
    },
  },
});
