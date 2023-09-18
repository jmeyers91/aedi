import { test, expect } from '@playwright/test';

test('renders title', async ({ page }) => {
  await page.goto('/');

  expect(await page.locator('h1').innerText()).toContain('Welcome');
});

test('renders title provided through client config', async ({ page }) => {
  await page.goto('/');

  expect(await page.locator('h2').innerText()).toContain('client config title');
});

test('can call the API healthcheck', async ({ page }) => {
  await page.goto('/');

  page.locator('button:text("Healthcheck")').click();

  await page.waitForResponse((response) =>
    response.url().endsWith('/healthcheck')
  );
  await page.waitForSelector('.healthy');

  expect(await page.locator('.healthy').innerText()).toContain('Healthy');
});
