import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Contact, ContactService } from './contact.service';

@Controller('contacts')
export class ContactController {
  constructor(
    @Inject(ContactService) private readonly contactService: ContactService
  ) {}

  @Get(':contactId')
  async findContact(@Param('contactId') contactId: string) {
    return this.contactService.findContact(contactId);
  }

  @Get()
  async listContacts() {
    return this.contactService.listContacts();
  }

  @Post()
  async createContact(@Body() body: Omit<Contact, 'id'>) {
    return this.contactService.createContact(body);
  }

  @Put(':contactId')
  async updateContact(
    @Param('contactId') contactId: string,
    @Body() body: Omit<Contact, 'id'>
  ) {
    return this.contactService.updateContact(contactId, body);
  }

  @Delete(':contactId')
  async deleteContact(@Param('contactId') contactId: string) {
    return this.contactService.deleteContact(contactId);
  }
}
