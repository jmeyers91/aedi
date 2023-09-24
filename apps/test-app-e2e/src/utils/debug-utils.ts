import { Response } from '@playwright/test';

export async function logResponse(res: Response) {
  console.log(res.url(), res.status(), (await res.body()).toString('utf-8'));
  return res;
}
