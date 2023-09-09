import {
  Injectable,
  CanActivate,
  ExecutionContext,
  applyDecorators,
  SetMetadata,
  UseGuards,
  createParamDecorator,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserPoolId } from '@sep6/constants';
import { getCurrentInvoke } from '@vendia/serverless-express';
import {
  APIGatewayProxyCognitoAuthorizer,
  APIGatewayProxyEventBase,
} from 'aws-lambda';

export const COGNITO_AUTHORIZER = Symbol('COGNITO_AUTHORIZER');

export interface CognitoAuthRequest {
  cognitoAuthorizerClaim?: {
    sub?: string;
  };
}

export interface CognitoAuthorizerRouteMetadata {
  userPool: UserPoolId;
}

@Injectable()
class CognitoAuthorizerGuard implements CanActivate {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<CognitoAuthRequest>();
    const invoke = getCurrentInvoke();
    const event: APIGatewayProxyEventBase<APIGatewayProxyCognitoAuthorizer> =
      invoke.event;

    request.cognitoAuthorizerClaim = event.requestContext.authorizer.claims;

    return !!request.cognitoAuthorizerClaim.sub;
  }
}

export function UseCognitoGuard(userPool: UserPoolId) {
  const cognitoAuthorizerRouteMetadata: CognitoAuthorizerRouteMetadata = {
    userPool,
  };
  return applyDecorators(
    SetMetadata(COGNITO_AUTHORIZER, cognitoAuthorizerRouteMetadata),
    UseGuards(CognitoAuthorizerGuard)
  );
}

export const CognitoClaim = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<CognitoAuthRequest>();
    const claim = request.cognitoAuthorizerClaim;

    if (!claim) {
      throw new UnauthorizedException();
    }

    return claim;
  }
);
