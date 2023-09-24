import { loadConstructRef, resolveConstructRef } from '@aedi/local';
import { Contact, service1, service2 } from './dynamo-crud-service';
import { randomUUID } from 'crypto';
import { FetchClient } from '@aedi/common';

describe('dynamo CRUD service', () => {
  test('APIs should not be the same', async () => {
    expect((await loadConstructRef(service1.api)).url).not.toEqual(
      (await loadConstructRef(service2.api)).url,
    );
  });
});

describe('dynamo CRUD service 1', () => {
  const userId = randomUUID();
  let contact: Contact;
  let apiFetch: FetchClient;

  beforeAll(async () => {
    apiFetch = await resolveConstructRef(FetchClient(service1.api));
  });

  describe('getServiceName', () => {
    test('Should return service 1', async () => {
      const response = await apiFetch(`/service-name`);

      expect(await response.json()).toEqual({
        serviceName: 'Contact service 1',
      });
    });
  });

  describe('listContacts', () => {
    test('GET /contacts - success', async () => {
      const response = await apiFetch(`/contacts`, {
        headers: {
          Authorization: randomUUID(),
        },
      });
      expect(await response.json()).toEqual({
        $metadata: expect.any(Object),
        ScannedCount: 0,
        count: 0,
        items: [],
      });
      expect(response.status).toEqual(200);
    });

    test('GET /contacts - fail unauthorized', async () => {
      const response = await apiFetch(`/contacts`);
      expect(await response.json()).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
      expect(response.status).toEqual(401);
    });
  });

  describe('createContact', () => {
    test('POST /contacts - success', async () => {
      const response = await apiFetch(`/contacts`, {
        method: 'POST',
        headers: {
          Authorization: userId,
        },
        body: JSON.stringify({
          firstName: 'first',
          lastName: 'last',
          email: 'email@example.com',
          phone: '+15551230000',
        }),
      });
      contact = await response.json();

      expect(contact).toEqual({
        userId,
        contactId: expect.any(String),
        firstName: 'first',
        lastName: 'last',
        email: 'email@example.com',
        phone: '+15551230000',
      });
      expect(response.status).toEqual(200);
    });

    test('POST /contacts - fail unauthorized', async () => {
      const response = await apiFetch(`/contacts`, { method: 'POST' });
      expect(await response.json()).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
      expect(response.status).toEqual(401);
    });
  });

  describe('getContact', () => {
    test('GET /contacts/{contactId} - success', async () => {
      const response = await apiFetch(`/contacts/${contact.contactId}`, {
        headers: {
          Authorization: userId,
        },
      });
      expect(response.status).toEqual(200);
      expect(await response.json()).toEqual(contact);
    });

    test('GET /contacts/{contactId} - fail not found', async () => {
      const response = await apiFetch(`/contacts/${randomUUID()}`, {
        headers: {
          Authorization: randomUUID(),
        },
      });
      expect(await response.json()).toEqual({
        message: 'Not found',
        statusCode: 404,
      });
      expect(response.status).toEqual(404);
    });

    test('GET /contacts/{contactId} - fail unauthorized', async () => {
      const response = await apiFetch(`/contacts/${randomUUID()}`);
      expect(await response.json()).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
      expect(response.status).toEqual(401);
    });
  });

  describe('updateContact', () => {
    test('PUT /contacts/{contactId} - success', async () => {
      const updates = {
        firstName: 'updated',
        email: 'updated@example.com',
      };

      const response = await apiFetch(`/contacts/${contact.contactId}`, {
        method: 'PUT',
        headers: {
          Authorization: userId,
        },
        body: JSON.stringify(updates),
      });

      expect(await response.json()).toEqual({ ...contact, ...updates });
      expect(response.status).toEqual(200);
    });
  });

  describe('deleteContact', () => {
    test('DELETE /contacts/{contactId} - success', async () => {
      const response = await apiFetch(`/contacts/${contact.contactId}`, {
        method: 'DELETE',
        headers: {
          Authorization: userId,
        },
      });

      expect(response.status).toEqual(200);
      expect(await response.json()).toEqual({ success: true });
    });
  });
});

describe('dynamo CRUD service 2', () => {
  const userId = randomUUID();
  let contact: Contact;
  let apiFetch: FetchClient;

  beforeAll(async () => {
    apiFetch = await resolveConstructRef(FetchClient(service2.api));
  });

  describe('getServiceName', () => {
    test('Should return service 2', async () => {
      const response = await apiFetch(`/service-name`);

      expect(await response.json()).toEqual({
        serviceName: 'Contact service 2',
      });
    });
  });

  describe('listContacts', () => {
    test('GET /contacts - success', async () => {
      const response = await apiFetch(`/contacts`, {
        headers: {
          Authorization: randomUUID(),
        },
      });
      expect(await response.json()).toEqual({
        $metadata: expect.any(Object),
        ScannedCount: 0,
        count: 0,
        items: [],
      });
      expect(response.status).toEqual(200);
    });

    test('GET /contacts - fail unauthorized', async () => {
      const response = await apiFetch(`/contacts`);
      expect(await response.json()).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
      expect(response.status).toEqual(401);
    });
  });

  describe('createContact', () => {
    test('POST /contacts - success', async () => {
      const response = await apiFetch(`/contacts`, {
        method: 'POST',
        headers: {
          Authorization: userId,
        },
        body: JSON.stringify({
          firstName: 'first',
          lastName: 'last',
          email: 'email@example.com',
          phone: '+15551230000',
        }),
      });
      contact = await response.json();

      expect(contact).toEqual({
        userId,
        contactId: expect.any(String),
        firstName: 'first',
        lastName: 'last',
        email: 'email@example.com',
        phone: '+15551230000',
      });
      expect(response.status).toEqual(200);
    });

    test('POST /contacts - fail unauthorized', async () => {
      const response = await apiFetch(`/contacts`, { method: 'POST' });
      expect(await response.json()).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
      expect(response.status).toEqual(401);
    });
  });

  describe('getContact', () => {
    test('GET /contacts/{contactId} - success', async () => {
      const response = await apiFetch(`/contacts/${contact.contactId}`, {
        headers: {
          Authorization: userId,
        },
      });
      expect(response.status).toEqual(200);
      expect(await response.json()).toEqual(contact);
    });

    test('GET /contacts/{contactId} - fail not found', async () => {
      const response = await apiFetch(`/contacts/${randomUUID()}`, {
        headers: {
          Authorization: randomUUID(),
        },
      });
      expect(await response.json()).toEqual({
        message: 'Not found',
        statusCode: 404,
      });
      expect(response.status).toEqual(404);
    });

    test('GET /contacts/{contactId} - fail unauthorized', async () => {
      const response = await apiFetch(`/contacts/${randomUUID()}`);
      expect(await response.json()).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
      expect(response.status).toEqual(401);
    });
  });

  describe('updateContact', () => {
    test('PUT /contacts/{contactId} - success', async () => {
      const updates = {
        firstName: 'updated',
        email: 'updated@example.com',
      };

      const response = await apiFetch(`/contacts/${contact.contactId}`, {
        method: 'PUT',
        headers: {
          Authorization: userId,
        },
        body: JSON.stringify(updates),
      });

      expect(await response.json()).toEqual({ ...contact, ...updates });
      expect(response.status).toEqual(200);
    });
  });

  describe('deleteContact', () => {
    test('DELETE /contacts/{contactId} - success', async () => {
      const response = await apiFetch(`/contacts/${contact.contactId}`, {
        method: 'DELETE',
        headers: {
          Authorization: userId,
        },
      });

      expect(response.status).toEqual(200);
      expect(await response.json()).toEqual({ success: true });
    });
  });
});
