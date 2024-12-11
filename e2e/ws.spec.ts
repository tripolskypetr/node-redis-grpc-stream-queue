import { test, expect, chromium } from "@playwright/test";

test("host-ws test", async () => {
  const browser = await chromium.launch(); // Launch Chromium
  const context = await browser.newContext({ ignoreHTTPSErrors: true }); // Create a new context
  const page = await context.newPage(); // Open a new page

  // Navigate to the target page
  await page.goto("http://localhost:80"); // Replace with your actual URL

  // Check session ID in sessionStorage
  const initialSessionId = await page.evaluate(() =>
    sessionStorage.getItem("session_id")
  );
  expect(initialSessionId).toBeTruthy();

  // Verify WebSocket connection is opened
  await expect(page.locator("pre")).toContainText(
    "WebSocket connection opened."
  );

  // Close the WebSocket (simulate behavior)
  await page.evaluate(() => {
    // @ts-ignore
    window.socket && window.socket.close();
  });

  await expect(page.locator("pre")).toContainText(
    "WebSocket connection closed."
  );

  // Wait 10 seconds
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Reload the page
  await page.reload();

  // Verify sessionStorage is preserved
  const reloadedSessionId = await page.evaluate(() =>
    sessionStorage.getItem("session_id")
  );
  expect(reloadedSessionId).toBe(initialSessionId);

  // Ensure WebSocket connection reopens after reload
  await expect(page.locator("pre")).toContainText(
    "WebSocket connection opened."
  );

  // Clean up
  await browser.close();
});
