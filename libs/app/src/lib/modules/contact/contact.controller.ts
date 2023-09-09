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
import { UserId } from '../../utils/auth-guard';
import { UserPoolId } from '@sep6/constants';
import { UseCognitoGuard } from '@sep6/utils';

@Controller('contacts')
@UseFilters(DevExceptionFilter)
@UseCognitoGuard(UserPoolId.APP_USER_POOL)
export class ContactController {
  constructor(
    @Inject(ContactService) private readonly contactService: ContactService
  ) {}

  @Get(':contactId')
  // @CognitoAuthorizer(UserPoolId.APP_USER_POOL)
  async findContact(
    @UserId() userId: string,
    @Param('contactId') contactId: string
  ) {
    return this.contactService.findContact({ userId, contactId });
  }

  @Get()
  async listContacts(@UserId() userId: string) {
    return this.contactService.listContacts({ userId });
  }

  @Post()
  async createContact(@UserId() userId: string, @Body() body: any) {
    try {
      return this.contactService.createContact({ ...body, userId });
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  @Put(':contactId')
  async updateContact(
    @UserId() userId: string,
    @Param('contactId') contactId: string,
    @Body() body: any
  ) {
    return this.contactService.updateContact({ userId, contactId }, body);
  }

  @Delete(':contactId')
  async deleteContact(
    @UserId() userId: string,
    @Param('contactId') contactId: string
  ) {
    return this.contactService.deleteContact({ userId, contactId });
  }
}
