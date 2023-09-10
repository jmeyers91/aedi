import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseFilters,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { DevExceptionFilter } from '../../utils/dev-exception-filter';
import { UserPoolId } from '@sep6/constants';
import { CognitoUserId, CognitoGuard } from '@sep6/utils';

@Controller('contacts')
@UseFilters(DevExceptionFilter)
@CognitoGuard(UserPoolId.APP_USER_POOL)
export class ContactController {
  constructor(
    @Inject(ContactService) private readonly contactService: ContactService
  ) {}

  @Get(':contactId')
  async findContact(
    @CognitoUserId() userId: string,
    @Param('contactId') contactId: string
  ) {
    return this.contactService.findContact({ userId, contactId });
  }

  @Get()
  async listContacts(@CognitoUserId() userId: string) {
    return this.contactService.listContacts({ userId });
  }

  @Post()
  async createContact(@CognitoUserId() userId: string, @Body() body: any) {
    try {
      return this.contactService.createContact({ ...body, userId });
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  @Put(':contactId')
  async updateContact(
    @CognitoUserId() userId: string,
    @Param('contactId') contactId: string,
    @Body() body: any
  ) {
    return this.contactService.updateContact({ userId, contactId }, body);
  }

  @Delete(':contactId')
  async deleteContact(
    @CognitoUserId() userId: string,
    @Param('contactId') contactId: string
  ) {
    return this.contactService.deleteContact({ userId, contactId });
  }
}
