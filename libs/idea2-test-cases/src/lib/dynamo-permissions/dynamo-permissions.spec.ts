import { resolveConstructRef } from '@aedi/idea2-local';
import { api as dynamoCrudApi } from './dynamo-permissions';
import { FetchClient } from '@aedi/idea2';

describe('dynamo permissions', () => {
  let apiFetch: FetchClient;

  beforeAll(async () => {
    apiFetch = await resolveConstructRef(FetchClient(dynamoCrudApi));
  });

  test('GET /read-success - success', async () => {
    const response = await apiFetch(`/read-success`);
    expect(await response.json()).toEqual({ success: true });
    expect(response.status).toEqual(200);
  });

  test('GET /write-success - success', async () => {
    const response = await apiFetch(`/write-success`);
    expect(await response.json()).toEqual({ success: true });
    expect(response.status).toEqual(200);
  });

  test('GET /write-success - success', async () => {
    const response = await apiFetch(`/write-fail`);

    expect(await response.json()).toEqual({
      success: false,
      error: expect.stringMatching(
        /User: .+? is not authorized to perform: dynamodb:PutItem on resource: .+? because no identity-based policy allows the dynamodb:PutItem action/,
      ),
    });
    expect(response.status).toEqual(200);
  });
});
