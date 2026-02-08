import { defineConfig } from '@playwright/test';

const previewPort = 4173;
const testSessionCode = process.env.PLAYWRIGHT_TEST_SESSION_CODE ?? 'TEST-TEST';
const testSessionName = process.env.PLAYWRIGHT_TEST_SESSION_NAME ?? 'Test Session';
const testSessionGmUsername = process.env.PLAYWRIGHT_TEST_SESSION_GM_USERNAME ?? 'Test GM';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${previewPort}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run build && npm run preview -- --port ${previewPort}`,
    port: previewPort,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      VITE_TEST_SESSION_CODE: testSessionCode,
      VITE_TEST_SESSION_NAME: testSessionName,
      VITE_TEST_SESSION_GM_USERNAME: testSessionGmUsername,
    },
  },
});
