import { test, expect } from '@playwright/test';

// ─── Swagger UI (headless browser) ───────────────────────────────────────────

test.describe('API Documentation (headless Chromium)', () => {
  test('Swagger UI loads and shows JobLoom title', async ({ page }) => {
    await page.goto('/api-docs');
    await expect(page).toHaveTitle(/swagger/i);
    await expect(page.locator('section.swagger-ui')).toBeVisible();
  });

  test('Swagger UI exposes the health endpoint section', async ({ page }) => {
    await page.goto('/api-docs');
    await page.waitForSelector('.swagger-ui .opblock', { timeout: 10_000 });
    const pageText = await page.locator('section.swagger-ui').innerText();
    expect(pageText.toLowerCase()).toContain('health');
  });

  test('Swagger UI JSON spec is reachable', async ({ request }) => {
    const res = await request.get('/api-docs/swagger.json');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('openapi');
    expect(body).toHaveProperty('paths');
  });
});

// ─── Health (headless browser) ────────────────────────────────────────────────

test.describe('Server Health (headless Chromium)', () => {
  test('health JSON page is reachable and returns status', async ({ page }) => {
    const res = await page.request.get('/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status');
  });

  test('unknown route returns JSON 404 not an HTML error page', async ({ page }) => {
    const res = await page.request.get('/api/does-not-exist-xyz');
    expect(res.status()).toBe(404);
    const contentType = res.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });
});
