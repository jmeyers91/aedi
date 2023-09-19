/* eslint-disable @typescript-eslint/no-explicit-any */
import { loadConstructRef } from '@sep6/idea2-local';
import { Contact, service1, service2 } from './dynamo-crud-service';
import { randomUUID } from 'crypto';

describe('dynamo CRUD service', () => {
  test('APIs should not be the same', async () => {
    expect((await loadConstructRef(service1.api)).url).not.toEqual(
      (await loadConstructRef(service2.api)).url
    );
  });
});

describe('dynamo CRUD service 1', () => {
  const userId = randomUUID();
  let contact: Contact;
  let apiUrl: string;

  beforeAll(async () => {
    apiUrl = (await loadConstructRef(service1.api)).url;
  });

  describe('getServiceName', () => {
    test('Should return service 1', async () => {
      const response = await fetch(`${apiUrl}/service-name`);

      expect(await response.json()).toEqual({
        serviceName: 'Contact service 1',
      });
    });
  });

  describe('listContacts', () => {
    test('GET /contacts - success', async () => {
      const response = await fetch(`${apiUrl}/contacts`, {
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
      const response = await fetch(`${apiUrl}/contacts`);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
      expect(response.status).toEqual(401);
    });
  });

  describe('createContact', () => {
    test('POST /contacts - success', async () => {
      const response = await fetch(`${apiUrl}/contacts`, {
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
      const response = await fetch(`${apiUrl}/contacts`, { method: 'POST' });
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
      expect(response.status).toEqual(401);
    });
  });

  describe('getContact', () => {
    test('GET /contacts/{contactId} - success', async () => {
      const response = await fetch(`${apiUrl}/contacts/${contact.contactId}`, {
        headers: {
          Authorization: userId,
        },
      });
      expect(response.status).toEqual(200);
      expect(await response.json()).toEqual(contact);
    });

    test('GET /contacts/{contactId} - fail not found', async () => {
      const response = await fetch(`${apiUrl}/contacts/${randomUUID()}`, {
        headers: {
          Authorization: randomUUID(),
        },
      });
      expect(await response.json()).toEqual({ error: 'Not found' });
      expect(response.status).toEqual(404);
    });

    test('GET /contacts/{contactId} - fail unauthorized', async () => {
      const response = await fetch(`${apiUrl}/contacts/${randomUUID()}`);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
      expect(response.status).toEqual(401);
    });
  });

  describe('updateContact', () => {
    test('PUT /contacts/{contactId} - success', async () => {
      const updates = {
        firstName: 'updated',
        email: 'updated@example.com',
      };

      const response = await fetch(`${apiUrl}/contacts/${contact.contactId}`, {
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
      const response = await fetch(`${apiUrl}/contacts/${contact.contactId}`, {
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
  let apiUrl: string;

  beforeAll(async () => {
    apiUrl = (await loadConstructRef(service2.api)).url;
  });

  describe('getServiceName', () => {
    test('Should return service 2', async () => {
      const response = await fetch(`${apiUrl}/service-name`);

      expect(await response.json()).toEqual({
        serviceName: 'Contact service 2',
      });
    });
  });

  describe('listContacts', () => {
    test('GET /contacts - success', async () => {
      const response = await fetch(`${apiUrl}/contacts`, {
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
      const response = await fetch(`${apiUrl}/contacts`);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
      expect(response.status).toEqual(401);
    });
  });

  describe('createContact', () => {
    test('POST /contacts - success', async () => {
      const response = await fetch(`${apiUrl}/contacts`, {
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
      const response = await fetch(`${apiUrl}/contacts`, { method: 'POST' });
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
      expect(response.status).toEqual(401);
    });
  });

  describe('getContact', () => {
    test('GET /contacts/{contactId} - success', async () => {
      const response = await fetch(`${apiUrl}/contacts/${contact.contactId}`, {
        headers: {
          Authorization: userId,
        },
      });
      expect(response.status).toEqual(200);
      expect(await response.json()).toEqual(contact);
    });

    test('GET /contacts/{contactId} - fail not found', async () => {
      const response = await fetch(`${apiUrl}/contacts/${randomUUID()}`, {
        headers: {
          Authorization: randomUUID(),
        },
      });
      expect(await response.json()).toEqual({ error: 'Not found' });
      expect(response.status).toEqual(404);
    });

    test('GET /contacts/{contactId} - fail unauthorized', async () => {
      const response = await fetch(`${apiUrl}/contacts/${randomUUID()}`);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
      expect(response.status).toEqual(401);
    });
  });

  describe('updateContact', () => {
    test('PUT /contacts/{contactId} - success', async () => {
      const updates = {
        firstName: 'updated',
        email: 'updated@example.com',
      };

      const response = await fetch(`${apiUrl}/contacts/${contact.contactId}`, {
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
      const response = await fetch(`${apiUrl}/contacts/${contact.contactId}`, {
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
