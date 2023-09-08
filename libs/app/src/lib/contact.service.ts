import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ContactTable,
  ContactTableKey,
  ContactTableRow,
} from './resources/contact-table.module';

@Injectable()
export class ContactService {
  constructor(
    @Inject(ContactTable) private readonly contactTable: ContactTable
  ) {}

  async findContact({
    userId,
    contactId,
  }: {
    userId: string;
    contactId: string;
  }) {
    return this.contactTable.get({ userId, contactId });
  }

  async listContacts({ userId }: { userId: string }) {
    return this.contactTable.query({
      KeyConditionExpression: `userId = :userId`,
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });
  }

  async createContact(fields: Omit<ContactTableRow, 'id'>) {
    const contact: ContactTableRow = {
      ...fields,
      contactId: randomUUID(),
    };
    await this.contactTable.put({
      Item: contact,
    });
    return contact;
  }

  async updateContact(
    key: { userId: string; contactId: string },
    fields: Partial<Omit<ContactTableRow, 'id'>>
  ) {
    if (!(await this.findContact(key))) {
      throw new BadRequestException(`Contact not found.`);
    }
    return this.contactTable.patch(key, fields);
  }

  async deleteContact(key: ContactTableKey) {
    return this.contactTable.delete({
      Key: key,
    });
  }
}
