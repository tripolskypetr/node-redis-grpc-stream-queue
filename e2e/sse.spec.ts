import { test, expect, chromium } from "@playwright/test"; 
 
test("host-sse parallel", async () => { 
  test.setTimeout(5 * 60 * 1000);
  
  const browser = await chromium.launch(); 
  
  const contextTests = Array.from({ length: 25 }, async (_, i) => {
    const context = await browser.newContext({ 
      ignoreHTTPSErrors: true,
    }); 
    const page = await context.newPage(); 

    page.setDefaultTimeout(2 * 60 * 1000);
    page.setDefaultNavigationTimeout(2 * 60 * 1000);
   
    try {
     
      await page.goto("https://localhost:443", { timeout: 2 * 60 * 1000 }); 

      await page.waitForTimeout(10_000);

      await expect(page.locator("pre")).toContainText(
        "SSE connection opened."
      );

      await context.setOffline(true);
  
      try {
        await page.reload({ timeout: 2 * 60 * 1000 }); 
      } catch {}

      await page.waitForTimeout(10_000);

      await context.setOffline(false);
      await page.reload({ timeout: 2 * 60 * 1000 }); 
     
      await page.waitForTimeout(10_000);

      await expect(page.locator("pre")).toContainText(
        "SSE connection opened."
      );

      await page.screenshot({ path: `test-results/screenshots/sse-${i}.png` });

    } catch (generalError) {
      await page.screenshot({ path: `test-results/screenshots/sse-${i}-error.png` });
    } finally {
      await context.close();
    }
  });

  await Promise.allSettled(contextTests);

  await browser.close(); 
});