import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.eval.ts'],
    globalSetup: ['./lib/start-mcp.ts'],
    testTimeout: 120_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    reporters: ['default'],
  },
})
