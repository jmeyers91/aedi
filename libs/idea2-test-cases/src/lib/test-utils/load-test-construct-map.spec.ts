import { loadTestConstructMap } from './load-test-construct-map';

describe('load-test-construct-map', () => {
  test('should load successfully', async () => {
    const map = await loadTestConstructMap();
    expect(map).toBeTruthy();
    expect(typeof map).toBe('object');
  });
});
