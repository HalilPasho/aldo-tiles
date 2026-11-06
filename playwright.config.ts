import { defineConfig, devices } from '@playwright/test';

// Not Astro's usual 4321, so a running `npm run dev` is never mistaken for the built site.
const PORT = Number(process.env.PLAYWRIGHT_PORT) || 4329;
const HOST = '127.0.0.1';
const baseURL = `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: './tests/browser',
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: { baseURL },
  projects: [
    {
      name: 'phone',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    // Under a coding agent, Astro moves the preview to the background and exits, which Playwright treats as a crash.
    // --ignore-lock keeps it in the foreground.
    command: `npm run preview -- --ignore-lock --host ${HOST} --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
