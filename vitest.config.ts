import { defineConfig } from 'vitest/config';
import stylex from '@stylexjs/unplugin';

export default defineConfig({
  // Compile with the same StyleX transform, without Vite's dev CSS polling server.
  plugins: [stylex.rollup({ dev: false, runtimeInjection: false })],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    restoreMocks: true,
  },
});
