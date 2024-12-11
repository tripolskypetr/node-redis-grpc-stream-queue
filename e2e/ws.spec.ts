import { test, expect, chromium, Browser } from "@playwright/test";

import { execpool } from "functools-kit";

const NAVIGATION_TIMEOUT = 1 * 60 * 1_000;
const STEP_TIMEOUT = 0.5 * 30 * 1_000;

const TOTAL_TESTS = 100;
const TESTS_PER_ITER = 10;

let browser: Browser;

test.beforeEach(async () => {
  browser = await chromium.launch();
});

test.afterEach(async () => {
  await browser.close();
});

test.setTimeout(0);

test("host-ws parallel", async () => {
  const makeTest = execpool(
    async (i) => {
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        viewport: {
          width: 800,
          height: 600
        }
      });
      const page = await context.newPage();

      page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);

      try {
        await page.goto("http://localhost:80");

        await page.waitForTimeout(STEP_TIMEOUT);

        await expect(page.locator("pre")).toContainText(
          "WebSocket connection opened."
        );

        await page.screenshot({ path: `test-results/screenshots/ws-${i}-brefore.png` });

        await context.setOffline(true);

        try {
          await page.reload();
        } catch {}

        await page.waitForTimeout(STEP_TIMEOUT);

        await context.setOffline(false);
        await page.reload();

        await page.waitForTimeout(STEP_TIMEOUT);

        await expect(page.locator("pre")).toContainText(
          "WebSocket connection opened."
        );

        await page.screenshot({ path: `test-results/screenshots/ws-${i}-after.png` });
      } catch (generalError) {
        await page.screenshot({
          path: `test-results/screenshots/ws-${i}-error.png`,
        });
      } finally {
        await context.close();
      }
    },
    {
      maxExec: 10,
    }
  );

  for (let i = 0; i < TOTAL_TESTS; i += TESTS_PER_ITER) {
    const batch = Array.from({ length: TESTS_PER_ITER }, (_, idx) => makeTest(i + idx));
    await Promise.allSettled(batch);
  }

  await expect(true).toBeTruthy();
});
