import { UserPoolId } from '@sep6/constants';
import {
  ILambdaEventHandler,
  LambdaModule,
  LambdaType,
  UserPoolModule,
} from '@sep6/utils';
import {
  PreAuthenticationTriggerEvent,
  PreSignUpTriggerEvent,
} from 'aws-lambda';
import { CountTable, CountTableModule } from '../tables/count.table';
import { Inject, Injectable } from '@nestjs/common';
import { ContactImageBucketModule } from '../buckets/contact-image/contact-image-bucket.module';

@Injectable()
class EventHandler implements ILambdaEventHandler {
  constructor(@Inject(CountTable) private readonly countTable: CountTable) {}

  async handleLambdaEvent(
    event: PreAuthenticationTriggerEvent | PreSignUpTriggerEvent
  ) {
    const counterId = event.triggerSource;
    const counter = await this.countTable.get({ counterId });
    const count = (counter?.count ?? 0) + 1;
    await this.countTable.put({
      Item: { counterId, count },
    });

    return event;
  }
}

@LambdaModule(
  {
    imports: [CountTableModule.grant({ write: true })],
  },
  {
    lambdaType: LambdaType.STANDARD,
    handlerService: EventHandler,
  }
)
export class AppUserPoolEventLambdaModule {}

@UserPoolModule({
  id: UserPoolId.APP_USER_POOL,
  lambdaTriggers: {
    preAuthentication: AppUserPoolEventLambdaModule,
    preSignUp: AppUserPoolEventLambdaModule,
  },
  permissions: [
    {
      actions: ['s3:ListBucket'],
      resources: [ContactImageBucketModule],
      condition: {
        StringLike: {
          's3:prefix': ['private/${cognito-identity.amazonaws.com:sub}'],
        },
      },
    },
    {
      actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
      resources: [
        ContactImageBucketModule.arn(
          (arn) => arn + '/*/${cognito-identity.amazonaws.com:sub}/*'
        ),
      ],
    },
  ],
})
export class AppUserPoolModule {}
