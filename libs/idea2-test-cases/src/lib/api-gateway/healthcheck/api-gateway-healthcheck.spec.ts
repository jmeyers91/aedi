describe('api-gateway healthcheck', () => {
  const apiUrl = 'https://3wjqy6ha24.execute-api.us-west-2.amazonaws.com/prod/';

  test('GET /healthcheck - success', async () => {
    const response = await fetch(`${apiUrl}/healthcheck`);
    expect(response.status).toEqual(200);
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
