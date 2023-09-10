import { ILambdaEventHandler, LambdaModule, LambdaType } from '@sep6/utils';
import { Context, Callback } from 'aws-lambda';

class CountEventHandlerService implements ILambdaEventHandler {
  handleLambdaEvent(event: unknown, context: Context, callback: Callback) {
    console.log(`Received event!`, event);
    callback(null, { cool: event });
  }
}

@LambdaModule(
  {},
  {
    lambdaType: LambdaType.STANDARD,
    handlerService: CountEventHandlerService,
  }
)
export class CountEventModule {}
