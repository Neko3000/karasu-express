import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.integration.test.ts',
      'tests/contract/**/*.contract.test.ts',
      'tests/int/**/*.int.spec.ts', // Legacy integration tests
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/', '*.config.*', 'src/payload-types.ts'],
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    // Enable module isolation to prevent mock leakage between test files
    isolate: true,
    // Run each test file in a separate worker for complete isolation
    fileParallelism: false,
    // Separate test pools for different test types
    poolOptions: {
      threads: {
        singleThread: true, // Required for MongoDB Memory Server
        isolate: true, // Ensure each test file has isolated module cache
      },
    },
  },
})
