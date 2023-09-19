import { resolveConstructRef } from '@sep6/idea2-local';
import { api } from './lambda-handler-proxy-example';
import { FetchClient } from '@sep6/idea2';

describe('lambda-handler-proxy-example', () => {
  let apiFetch: FetchClient;

  beforeAll(async () => {
    apiFetch = await resolveConstructRef(FetchClient(api));
  });

  test('GET /healthcheck - success', async () => {
    const response = await apiFetch(`/healthcheck`);
    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({
      testName: 'healthcheck',
      success: true,
    });
  });

  test('POST /echo - success', async () => {
    const response = await apiFetch(`/echo`, {
      method: 'POST',
      body: JSON.stringify({ cool: 'beans' }),
    });
    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({ cool: 'beans' });
  });
});
