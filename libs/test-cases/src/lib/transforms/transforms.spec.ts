import { resolveConstructRef } from '@aedi/local';
import { api } from './transforms';
import { randomUUID } from 'crypto';
import { FetchClient } from '@aedi/common';

describe('transforms', () => {
  let apiFetch: FetchClient;

  beforeAll(async () => {
    apiFetch = await resolveConstructRef(FetchClient(api));
  });

  test('GET /test-count - success - should return 0', async () => {
    const response = await apiFetch(`/test-count`);
    expect(response.status).toEqual(200);
    expect(await response.json()).toEqual({
      count: 0,
    });
  });

  test('GET /count/{counterId} - success - should return latest count', async () => {
    const counterId = randomUUID();

    expect(await (await apiFetch(`/counter/${counterId}`)).json()).toEqual({
      count: 0,
    });

    await apiFetch(`/counter/${counterId}`, {
      method: 'POST',
    });
    expect(await (await apiFetch(`/counter/${counterId}`)).json()).toEqual({
      count: 1,
    });

    await apiFetch(`/counter/${counterId}`, {
      method: 'POST',
    });
    expect(await (await apiFetch(`/counter/${counterId}`)).json()).toEqual({
      count: 2,
    });

    await apiFetch(`/counter/${counterId}`, {
      method: 'POST',
    });
    expect(await (await apiFetch(`/counter/${counterId}`)).json()).toEqual({
      count: 3,
    });
  });

  test('GET /static-transform - success - should return the same value for repeated runs', async () => {
    const response1 = await apiFetch(`/static-transform`);
    expect(response1.status).toEqual(200);
    expect(await response1.json()).toEqual({
      runCount: 1,
      staticInvokeCount: 1,
    });

    const response2 = await apiFetch(`/static-transform`);
    expect(response2.status).toEqual(200);
    expect(await response2.json()).toEqual({
      runCount: 1,
      staticInvokeCount: 1,
    });

    const response3 = await apiFetch(`/static-transform`);
    expect(response3.status).toEqual(200);
    expect(await response3.json()).toEqual({
      runCount: 1,
      staticInvokeCount: 1,
    });

    const response4 = await apiFetch(`/static-transform`);
    expect(response4.status).toEqual(200);
    expect(await response4.json()).toEqual({
      runCount: 1,
      staticInvokeCount: 1,
    });
  });

  test('GET /static-transform-2 - success - should return the same value for repeated runs', async () => {
    const response1 = await apiFetch(`/static-transform-2`);
    const response1Body = await response1.json();

    expect(response1.status).toEqual(200);
    expect(response1Body).toEqual({
      uuid: expect.any(String),
    });

    const response2 = await apiFetch(`/static-transform-2`);
    expect(response2.status).toEqual(200);
    expect(await response2.json()).toEqual(response1Body);

    const response3 = await apiFetch(`/static-transform-2`);
    expect(response3.status).toEqual(200);
    expect(await response3.json()).toEqual(response1Body);

    const response4 = await apiFetch(`/static-transform-2`);
    expect(response4.status).toEqual(200);
    expect(await response4.json()).toEqual(response1Body);
  });

  test('GET /invoke-transform - success - should return different values for repeated runs', async () => {
    const response1 = await apiFetch(`/invoke-transform`);
    const response1Body = await response1.json();

    expect(response1.status).toEqual(200);
    expect(response1Body).toEqual({
      uuid: expect.any(String),
    });

    const response2 = await apiFetch(`/invoke-transform`);
    const response2Body = await response2.json();
    expect(response2.status).toEqual(200);
    expect(response2Body).toEqual({
      uuid: expect.any(String),
    });
    expect(response2Body).not.toEqual(response1Body);

    const response3 = await apiFetch(`/invoke-transform`);
    const response3Body = await response3.json();
    expect(response3.status).toEqual(200);
    expect(response3Body).toEqual({
      uuid: expect.any(String),
    });
    expect(response3Body).not.toEqual(response1Body);

    const response4 = await apiFetch(`/invoke-transform`);
    const response4Body = await response4.json();
    expect(response4.status).toEqual(200);
    expect(response4Body).toEqual({
      uuid: expect.any(String),
    });
    expect(response4Body).not.toEqual(response1Body);
  });

  test('GET /nested-transform - success - should return different values for the dynamic portion but the same values for the static portion', async () => {
    const requestCount = 5;
    const responses: { uuid: { staticUuid: string; dynamicUuid: string } }[] =
      [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of Array.from({ length: requestCount })) {
      const response = await apiFetch(`/nested-transform`);
      responses.push(await response.json());
    }

    const staticIds = new Set(
      responses.map((response) => response.uuid.staticUuid),
    );
    const dynamicIds = new Set(
      responses.map((response) => response.uuid.dynamicUuid),
    );

    expect(staticIds.size).toEqual(1);
    expect(dynamicIds.size).toEqual(requestCount);
  });
});
