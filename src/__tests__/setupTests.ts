// @ts-check
import { createRequire } from 'node:module';
import { PassThrough } from 'node:stream';

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

import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
