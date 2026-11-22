import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Tests run on Node, not on a device. What is tested here is the logic
 * that has no business knowing which platform it is on: the client,
 * the schemas, the rules. Component rendering is a separate concern
 * with a separate cost.
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
