import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import { fakePassword } from './utils/register-utils';
import { waitForCognitoLogin } from './utils/cognito-utils';

test('register as a test user - redirected to the contact list', async ({
  page,
}) => {
  await page.goto('/register');

  expect(await page.locator('h3').innerText()).toContain('Register');

  const password = fakePassword();

  await page.getByPlaceholder('Username').fill(randomUUID());
  await page.getByPlaceholder(/^Password$/).fill(password);
  await page.getByPlaceholder('Password confirmed').fill(password);
  await page.locator('button[type="submit"]').click();

  await waitForCognitoLogin(page);

  expect(
    await page.waitForResponse(
      (res) => res.url().endsWith('/contacts') && res.status() === 200,
    ),
  ).toBeTruthy();
});

test('invalid password - error', async ({ page }) => {
  await page.goto('/register');

  expect(await page.locator('h3').innerText()).toContain('Register');

  await page.getByPlaceholder('Username').fill(randomUUID());
  await page.getByPlaceholder(/^Password$/).fill('bad');
  await page.getByPlaceholder('Password confirmed').fill('bad');
  await page.locator('button[type="submit"]').click();

  await page.waitForSelector('.error-message');
  const errorMessages = page.locator('.error-message');

  expect(await errorMessages.count()).toEqual(1);
  expect(await errorMessages.allInnerTexts()).toEqual([
    'Password did not conform with policy: Password not long enough',
  ]);
});

test('invalid username - error', async ({ page }) => {
  await page.goto('/register');

  expect(await page.locator('h3').innerText()).toContain('Register');

  await page.getByPlaceholder('Username').fill('');
  await page.getByPlaceholder(/^Password$/).fill(fakePassword());
  await page.getByPlaceholder('Password confirmed').fill(fakePassword());
  await page.locator('button[type="submit"]').click();

  await page.waitForSelector('.error-message');
  const errorMessages = page.locator('.error-message');

  expect(await errorMessages.count()).toEqual(1);
  expect(await errorMessages.allInnerTexts()).toEqual([
    'Username is required.',
  ]);
});

test(`passwords don't match - error`, async ({ page }) => {
  await page.goto('/register');

  expect(await page.locator('h3').innerText()).toContain('Register');

  await page.getByPlaceholder('Username').fill(randomUUID());
  await page.getByPlaceholder(/^Password$/).fill(fakePassword());
  await page
    .getByPlaceholder('Password confirmed')
    .fill(fakePassword() + '123');
  await page.locator('button[type="submit"]').click();

  await page.waitForSelector('.error-message');
  const errorMessages = page.locator('.error-message');

  expect(await errorMessages.count()).toEqual(1);
  expect(await errorMessages.allInnerTexts()).toEqual([
    `Passwords don't match.`,
  ]);
});
