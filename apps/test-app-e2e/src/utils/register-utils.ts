import { Page, expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import { waitForCognitoLogin } from './cognito-utils';

export function fakePassword() {
  return `Secret123!`;
}

export async function registerAsTestUser(page: Page) {
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
}
