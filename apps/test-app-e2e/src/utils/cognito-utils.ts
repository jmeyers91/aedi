import { Page } from '@playwright/test';
import { logResponse } from './debug-utils';

export async function waitForCognitoLogin(page: Page) {
  await page.waitForResponse(async (res) => {
    console.log(`Waiting for cognito login`);
    logResponse(res);
    return (
      res.url() === 'https://cognito-idp.us-west-2.amazonaws.com/' &&
      res.status() === 200
    );
  });
}
