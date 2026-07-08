import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest の設定定義
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
