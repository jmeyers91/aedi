import { getConstructRef } from '@sep6/idea2-local';
import { loadTestConstructMap } from '../test-utils/load-test-construct-map';
import { api as dynamoCrudApi } from './dynamo-crud';
import { randomUUID } from 'crypto';

describe('dynamo CRUD', () => {
  const userId = randomUUID();
  let contact: any;
  let apiUrl: string;

  beforeAll(async () => {
    apiUrl = getConstructRef(await loadTestConstructMap(), dynamoCrudApi).url;
  });

  describe('reply', () => {
    test('GET /html - success - strings should be returned as HTML', async () => {
      const response = await fetch(`${apiUrl}/html`);

      expect(response.status).toEqual(200);
      expect(await response.text()).toMatch(
        'This text is assumed to be HTML and is returned as-is'
      );
      expect(response.headers.get('Content-Type')).toBe(
        'text/html; charset=utf-8'
      );
    });

    test('GET /json - success - objects should be returned as JSON', async () => {
      const response = await fetch(`${apiUrl}/json`);

      expect(response.status).toEqual(200);
      expect(await response.json()).toEqual({
        message:
          'This object is assumed to be JSON and is stringified before being returned',
      });
      expect(response.headers.get('Content-Type')).toBe(
        'application/json; charset=utf-8'
      );
    });

    test('GET /teapot - success - the reply function can be used to override default status/headers', async () => {
      const response = await fetch(`${apiUrl}/teapot`);

      expect(response.status).toEqual(418);
      expect(await response.text()).toEqual("I'm a teapot");
      expect(response.headers.get('Content-Type')).toBe('piping-hot/tea');
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

  describe('exportContacts', () => {
    test('GET /contacts.csv - success', async () => {
      const response = await fetch(`${apiUrl}/contacts.csv`, {
        headers: {
          Authorization: userId,
        },
      });

      expect(response.status).toEqual(200);
      expect(await response.text()).toMatch(
        /firstName, lastName, email, phone/
      );
      expect(response.headers.get('Content-Type')).toBe('text/csv');
    });
  });
});
