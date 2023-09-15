import { getConstructRef } from '@sep6/idea2-local';
import { loadTestConstructMap } from '../test-utils/load-test-construct-map';
import { api } from './transforms';

describe('transforms', () => {
  let apiUrl: string;

  beforeAll(async () => {
    apiUrl = getConstructRef(await loadTestConstructMap(), api).url;
  });

  test('GET /test-count - success - should return 0', async () => {
    const response = await fetch(`${apiUrl}/test-count`);
    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({
      count: 0,
    });
  });
});
