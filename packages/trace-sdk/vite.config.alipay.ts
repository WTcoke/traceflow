import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'entry-alipay.ts'),
      formats: ['cjs', 'es'],
      fileName: (format: string) => `trace-sdk.alipay.${format}.js`,
    },
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {},
    },
    target: 'es2015',
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // 小程序构建中将 Node.js 内置模块替换为空模块
      os: resolve(__dirname, 'src/adapter/empty-module.ts'),
      crypto: resolve(__dirname, 'src/adapter/empty-module.ts'),
    },
  },
});
