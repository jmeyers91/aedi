import { loadConstructRef } from '@sep6/idea2-local';
import { api } from './api-gateway-healthcheck-multi';

describe('api-gateway healthcheck', () => {
  let apiUrl: string;

  beforeAll(async () => {
    apiUrl = (await loadConstructRef(api)).url;
  });

  test('GET /healthcheck - success', async () => {
    const response = await fetch(`${apiUrl}/healthcheck`);
    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({
      testName: 'healthcheck-multi',
      success: true,
    });
  });

  test('POST /echo - success', async () => {
    const response = await fetch(`${apiUrl}/echo`, {
      method: 'POST',
      body: JSON.stringify({ cool: 'beans' }),
    });
    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({ cool: 'beans' });
  });
});
