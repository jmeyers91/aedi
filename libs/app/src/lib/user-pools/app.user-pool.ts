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

@Injectable()
class EventHandler implements ILambdaEventHandler {
  constructor(@Inject(CountTable) private readonly countTable: CountTable) {}

  async handleLambdaEvent(
    event: PreAuthenticationTriggerEvent | PreSignUpTriggerEvent
  ) {
    console.log(`GOT EVENT!`, event);
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
    name: 'app-user-pool-event-handler',
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
})
export class AppUserPoolModule {}
