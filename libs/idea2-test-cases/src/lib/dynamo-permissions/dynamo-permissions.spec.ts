import { getConstructRef } from '@sep6/idea2-local';
import { loadTestConstructMap } from '../test-utils/load-test-construct-map';
import { api as dynamoCrudApi } from './dynamo-permissions';

describe('dynamo permissions', () => {
  let apiUrl: string;

  beforeAll(async () => {
    apiUrl = getConstructRef(await loadTestConstructMap(), dynamoCrudApi).url;
  });

  test('GET /read-success - success', async () => {
    const response = await fetch(`${apiUrl}/read-success`);
    expect(await response.json()).toEqual({ success: true });
    expect(response.status).toEqual(200);
  });

  test('GET /write-success - success', async () => {
    const response = await fetch(`${apiUrl}/write-success`);
    expect(await response.json()).toEqual({ success: true });
    expect(response.status).toEqual(200);
  });

  test('GET /write-success - success', async () => {
    const response = await fetch(`${apiUrl}/write-fail`);

    expect(await response.json()).toEqual({
      success: false,
      error: expect.stringMatching(
        /User: .+? is not authorized to perform: dynamodb:PutItem on resource: .+? because no identity-based policy allows the dynamodb:PutItem action/
      ),
    });
    expect(response.status).toEqual(200);
  });
});
