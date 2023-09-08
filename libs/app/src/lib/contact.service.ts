import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DbService } from './db.service';
import { ContactPhotoBucket } from './contact-photo-bucket.module';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo: string | null;
}

@Injectable()
export class ContactService {
  private readonly contacts: Contact[] = [];

  constructor(
    @Inject(DbService) private readonly db: DbService,
    @Inject(ContactPhotoBucket)
    private readonly contactPhotoBucket: ContactPhotoBucket
  ) {}

  async findContact(contactId: string): Promise<Contact | undefined> {
    const contact = await this.db.query(
      this.contacts.find((contact) => contact.id === contactId)
    );

    if (contact) {
      contact.photo = await this.contactPhotoBucket.getFile(
        `contacts/${contact.id}`
      );
    }

    return contact;
  }

  async listContacts(): Promise<Contact[]> {
    return this.db.query(this.contacts);
  }

  async createContact(fields: Omit<Contact, 'id'>): Promise<Contact> {
    const contact: Contact = { id: randomUUID(), ...fields };
    this.contacts.push(contact);
    return this.db.query(contact);
  }

  async updateContact(
    contactId: string,
    fields: Partial<Omit<Contact, 'id'>>
  ): Promise<Contact> {
    const contact = await this.findContact(contactId);
    if (!contact) {
      throw new Error('Contact not found.');
    }
    return this.db.query(Object.assign(contact, fields));
  }

  async deleteContact(contactId: string): Promise<void> {
    const contactIndex = this.contacts.findIndex(
      (contact) => contact.id === contactId
    );
    if (contactIndex < 0) {
      throw new Error('Contact not found.');
    }
    this.contacts.splice(contactIndex, 1);
    return this.db.query(undefined);
  }
}
