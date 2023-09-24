import { test, expect } from '@playwright/test';
import { registerAsTestUser } from './utils/register-utils';
import { logResponse } from './utils/debug-utils';

test('empty contact list', async ({ page }) => {
  await registerAsTestUser(page);

  const contactListItems = page.getByTestId('contact-list').locator('p');

  expect(await contactListItems.count()).toEqual(1);
  expect(await contactListItems.allInnerTexts()).toEqual([
    "You don't have any contacts yet.",
  ]);
});

test('add a contact', async ({ page }) => {
  await registerAsTestUser(page);

  await page.getByTestId('add-contact-button').click();
  await page.waitForSelector('[data-testid="add-contact-section"]');

  await page.getByPlaceholder('First name').fill('first');
  await page.getByPlaceholder('Last name').fill('last');
  await page.getByPlaceholder('Email').fill('email@example.com');
  await page.getByPlaceholder('Phone').fill('+15551112222');

  await page.getByText('Save').click();

  await Promise.all([
    // Create contact
    page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().endsWith('/contacts') &&
        res.status() === 200,
    ),
    // Re-fetch the contact list
    page.waitForResponse(
      (res) =>
        res.request().method() === 'GET' &&
        res.url().endsWith('/contacts') &&
        res.status() === 200,
    ),
  ]);

  // Loaded the new contact for viewing
  await page.waitForSelector('[data-testid="contact-name"]');
  expect(await page.getByTestId('contact-name').allInnerTexts()).toEqual([
    'First Last',
  ]);

  expect(
    await page.getByTestId('contact-list').locator('p').allInnerTexts(),
  ).toEqual(['First Last', 'email@example.com, +15551112222']);
});

test('edit and delete a contact', async ({ page }) => {
  await registerAsTestUser(page);

  await page.getByTestId('add-contact-button').click();
  await page.waitForSelector('[data-testid="add-contact-section"]');

  await page.getByPlaceholder('First name').fill('first');
  await page.getByPlaceholder('Last name').fill('last');
  await page.getByPlaceholder('Email').fill('email@example.com');
  await page.getByPlaceholder('Phone').fill('+15551112222');

  await page.getByText('Save').click();

  const [createResponse] = await Promise.all([
    // Create contact
    page.waitForResponse(
      async (res) =>
        (await logResponse(res)).request().method() === 'POST' &&
        res.url().endsWith('/contacts') &&
        res.status() === 200,
    ),
    // Re-fetch the contact list
    page.waitForResponse(
      (res) =>
        res.request().method() === 'GET' &&
        res.url().endsWith('/contacts') &&
        res.status() === 200,
    ),
  ]);

  const { contactId } = JSON.parse(
    (await createResponse.body()).toString('utf8'),
  );

  await page.getByTestId('edit-contact-button').click();

  // Fetch the contact
  await page.waitForResponse(
    (res) =>
      res.request().method() === 'GET' &&
      res.url().includes('/contacts/') &&
      res.status() === 200,
  );

  await page.waitForSelector('[data-testid="edit-contact-section"]');

  const firstNameInput = await page.getByPlaceholder('First name');
  const lastNameInput = await page.getByPlaceholder('Last name');
  const emailInput = await page.getByPlaceholder('Email');
  const phoneInput = await page.getByPlaceholder('Phone');

  // Inputs should contain the original values
  expect(await firstNameInput.inputValue()).toEqual('first');
  expect(await lastNameInput.inputValue()).toEqual('last');
  expect(await emailInput.inputValue()).toEqual('email@example.com');
  expect(await phoneInput.inputValue()).toEqual('+15551112222');

  await firstNameInput.fill('uno');
  await lastNameInput.fill('dos');
  await emailInput.fill('updated@example.com');
  await phoneInput.fill('+15552223333');

  await page.getByText('Save').click();

  await Promise.all([
    // Update contact
    page.waitForResponse(
      async (res) =>
        (await logResponse(res)).request().method() === 'PUT' &&
        res.url().endsWith(`/contacts/${contactId}`) &&
        res.status() === 200,
    ),
    // Re-fetch the contact list
    page.waitForResponse(
      (res) =>
        res.request().method() === 'GET' &&
        res.url().endsWith('/contacts') &&
        res.status() === 200,
    ),
    // Re-fetch updated contact
    page.waitForResponse(
      (res) =>
        res.request().method() === 'GET' &&
        res.url().endsWith(`/contacts/${contactId}`) &&
        res.status() === 200,
    ),
  ]);

  await page.waitForSelector('[data-testid="contact-name"]');
  expect(await page.getByTestId('contact-name').allInnerTexts()).toEqual([
    'Uno Dos',
  ]);

  await page.getByTestId('edit-contact-button').click();
  await page.getByTestId('delete-contact-button').click();
  await page.locator('.swal2-confirm').click();

  await Promise.all([
    // Delete
    page.waitForResponse(
      (res) =>
        res.request().method() === 'DELETE' &&
        res.url().endsWith(`/contacts/${contactId}`) &&
        res.status() === 200,
    ),
    // Re-fetch the contact list
    page.waitForResponse(
      (res) =>
        res.request().method() === 'GET' &&
        res.url().endsWith('/contacts') &&
        res.status() === 200,
    ),
  ]);

  // Back to having no contacts
  expect(
    await page.waitForSelector('[data-testid="empty-contact-list"]'),
  ).toBeTruthy();
});

test('error - missing first name', async ({ page }) => {
  await registerAsTestUser(page);

  await page.getByTestId('add-contact-button').click();
  await page.waitForSelector('[data-testid="add-contact-section"]');

  await page.getByPlaceholder('First name').fill('');
  await page.getByPlaceholder('Last name').fill('last');
  await page.getByPlaceholder('Email').fill('email@example.com');
  await page.getByPlaceholder('Phone').fill('+15551112222');

  await page.getByText('Save').click();

  await page.waitForResponse(
    (res) =>
      res.request().method() === 'POST' &&
      res.url().endsWith('/contacts') &&
      res.status() === 400,
  );
  await page.waitForSelector('.error-message');
  expect(await page.locator('.error-message').allInnerTexts()).toEqual([
    'First name is required.',
  ]);
});

test('multiple errors', async ({ page }) => {
  await registerAsTestUser(page);

  await page.getByTestId('add-contact-button').click();
  await page.waitForSelector('[data-testid="add-contact-section"]');

  await page.getByPlaceholder('First name').fill('');
  await page.getByPlaceholder('Last name').fill('last');
  await page.getByPlaceholder('Email').fill('emailexample.com');
  await page.getByPlaceholder('Phone').fill('');

  await page.getByText('Save').click();

  await page.waitForResponse(
    (res) =>
      res.request().method() === 'POST' &&
      res.url().endsWith('/contacts') &&
      res.status() === 400,
  );
  await page.waitForSelector('.error-message');
  expect(await page.locator('.error-message').allInnerTexts()).toEqual([
    'First name is required.',
    'Must be a valid email address.',
  ]);
});
