import { test, expect, chromium } from "@playwright/test";

test("host-sse test", async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await page.goto("https://localhost:443");

  // Check session ID in sessionStorage
  const sessionId = await page.evaluate(() =>
    sessionStorage.getItem("session_id")
  );
  expect(sessionId).toBeTruthy();

  // Verify SSE connection is opened
  await expect(page.locator("pre")).toContainText(
    "SSE connection opened."
  );

  await page.evaluate(() => {
    // @ts-ignore
    window.eventSource && window.eventSource.close();
  });

  await new Promise((resolve) => setTimeout(resolve, 10000));

  await page.reload();

  const newSessionId = await page.evaluate(() =>
    sessionStorage.getItem("session_id")
  );
  expect(newSessionId).toBe(sessionId);

  await expect(page.locator("pre")).toContainText(`Session id: ${sessionId}`);

  await browser.close();
});
