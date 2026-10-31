/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
