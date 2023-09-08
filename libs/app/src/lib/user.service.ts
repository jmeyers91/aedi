import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface User {
  id: string;
  username: string;
  password: string;
}

@Injectable()
export class UserService {
  private readonly contacts: User[] = [];

  async findUser(contactId: string): Promise<User | undefined> {
    return this.contacts.find((contact) => contact.id === contactId);
  }

  async listUsers(): Promise<User[]> {
    return this.contacts;
  }

  async createUser(fields: Omit<User, 'id'>): Promise<User> {
    const contact: User = { id: randomUUID(), ...fields };
    this.contacts.push(contact);
    return contact;
  }

  async updateUser(
    contactId: string,
    fields: Partial<Omit<User, 'id'>>
  ): Promise<User> {
    const contact = await this.findUser(contactId);
    if (!contact) {
      throw new Error('User not found.');
    }
    return Object.assign(contact, fields);
  }

  async deleteUser(contactId: string): Promise<void> {
    const contactIndex = this.contacts.findIndex(
      (contact) => contact.id === contactId
    );
    if (contactIndex < 0) {
      throw new Error('User not found.');
    }
    this.contacts.splice(contactIndex, 1);
    return undefined;
  }
}
