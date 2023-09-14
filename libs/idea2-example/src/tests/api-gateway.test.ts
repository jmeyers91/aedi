describe('API gateway', () => {
  const apiUrl = 'https://bqi5lc3i1b.execute-api.us-west-2.amazonaws.com/prod';

  test('should be able to hit the healthcheck endpoint', async () => {
    const response = await fetch(`${apiUrl}/healthcheck`);
    expect(response.status).toEqual(200);
  });
});
