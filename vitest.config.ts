import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['server/**/__test__/*.test.ts'],
    setupFiles: ['server/utils/__test__/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['server/api/**/*.ts', 'server/utils/**/*.ts'],
      exclude: ['server/db/**', 'server/types/**', 'server/plugins/**']
    }
  }
})
