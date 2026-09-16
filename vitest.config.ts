import { defineConfig } from 'vitest/config';

// Pure modules only: packages/surat, src/ledger/tab.ts, src/ads/settleState.ts,
// src/rc/attributes.ts, src/i18n. No device, no key, no network.
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
