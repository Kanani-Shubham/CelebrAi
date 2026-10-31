import { createRequire } from 'node:module';
import { PassThrough } from 'node:stream';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Polyfill Node < 22 zlib.createZstdDecompress required by undici decompress interceptor
const req = createRequire(import.meta.url);
const nodeZlib = req('node:zlib');

if (typeof nodeZlib.createZstdDecompress !== 'function') {
  Object.defineProperty(nodeZlib, 'createZstdDecompress', {
    value: () => new PassThrough(),
    writable: true,
    configurable: true,
  });
}
if (!nodeZlib.constants) {
  Object.defineProperty(nodeZlib, 'constants', {
    value: {},
    writable: true,
    configurable: true,
  });
}
if (nodeZlib.constants && nodeZlib.constants.ZSTD_d_windowLogMax === undefined) {
  Object.defineProperty(nodeZlib.constants, 'ZSTD_d_windowLogMax', {
    value: 23,
    writable: true,
    configurable: true,
  });
}

export default defineConfig({
  plugins: [react() as unknown as import('vitest/config').Plugin],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/utils/security.ts',
        'src/utils/validation.ts',
        'src/utils/taskCalculations.ts',
        'src/utils/dateUtils.ts',
        'src/components/ui/toast.ts',
        'src/components/ui/index.tsx',
        'src/components/common/ErrorBoundary.tsx',
        'src/services/storage/indexedDBAvatar.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
  },
});
