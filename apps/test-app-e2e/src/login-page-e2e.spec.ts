import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

const username = 'e2e';
const password = 'Secret123!';

test('index page redirects to the login page', async ({ page }) => {
  await page.goto('/');

  expect(await page.locator('h3').innerText()).toContain('Login');
});

test('login page renders', async ({ page }) => {
  await page.goto('/login');

  expect(await page.locator('h3').innerText()).toContain('Login');
});

test('invalid username', async ({ page }) => {
  await page.goto('/login');

  expect(await page.locator('h3').innerText()).toContain('Login');

  await page.getByPlaceholder('Username').fill(randomUUID());
  await page.getByPlaceholder('Password').fill(password);
  await page.locator('button[type="submit"]').click();

  await page.waitForResponse('https://cognito-idp.us-west-2.amazonaws.com/');
  await page.waitForSelector('.error-message');
  const errorMessages = page.locator('.error-message');

  expect(await errorMessages.count()).toEqual(1);
  expect(await errorMessages.allInnerTexts()).toEqual([
    'Incorrect username or password.',
  ]);
});

test('invalid password', async ({ page }) => {
  await page.goto('/login');

  expect(await page.locator('h3').innerText()).toContain('Login');

  await page.getByPlaceholder('Username').fill(randomUUID());
  await page.getByPlaceholder('Password').fill('NotThePassword321!');
  await page.locator('button[type="submit"]').click();

  await page.waitForResponse('https://cognito-idp.us-west-2.amazonaws.com/');
  await page.waitForSelector('.error-message');
  const errorMessages = page.locator('.error-message');

  expect(await errorMessages.count()).toEqual(1);
  expect(await errorMessages.allInnerTexts()).toEqual([
    'Incorrect username or password.',
  ]);
});

test('invalid username and password', async ({ page }) => {
  await page.goto('/login');

  expect(await page.locator('h3').innerText()).toContain('Login');

  await page.getByPlaceholder('Username').fill(randomUUID());
  await page.getByPlaceholder('Password').fill('NotThePassword321!');
  await page.locator('button[type="submit"]').click();

  await page.waitForResponse('https://cognito-idp.us-west-2.amazonaws.com/');
  await page.waitForSelector('.error-message');
  const errorMessages = page.locator('.error-message');

  expect(await errorMessages.count()).toEqual(1);
  expect(await errorMessages.allInnerTexts()).toEqual([
    'Incorrect username or password.',
  ]);
});

test('login as a test user - redirected to the contact list', async ({
  page,
}) => {
  await page.goto('/login');

  expect(await page.locator('h3').innerText()).toContain('Login');

  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill(password);
  await page.locator('button[type="submit"]').click();

  await page.waitForLoadState();
  await page.waitForResponse('https://cognito-idp.us-west-2.amazonaws.com/');

  expect(
    await page.waitForRequest((req) => req.url().endsWith('/contacts')),
  ).toBeTruthy();
});
