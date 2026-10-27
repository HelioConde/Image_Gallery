import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  timeout: 45_000,
  fullyParallel: false,
  outputDir: 'test-results/visual-runs',
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never', outputFolder: 'visual-playwright-report' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.VISUAL_BASE_URL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
  },
  webServer: process.env.VISUAL_BASE_URL ? undefined : {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173/?demo=1',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
