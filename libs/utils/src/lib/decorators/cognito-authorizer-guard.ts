/* eslint-disable @typescript-eslint/no-explicit-any */
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

export interface CognitoClaim {
  sub: string;
  email_verified?: string;
  iss?: string;
  'cognito:username'?: string;
  origin_jti?: string;
  aud?: string;
  event_id?: string;
  token_use?: string;
  auth_time?: string;
  exp?: string;
  iat?: string;
  jti?: string;
  email?: string;
}

export interface CognitoAuthRequest {
  cognitoAuthorizerClaim?: CognitoClaim;
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
    const { claims } = event.requestContext.authorizer;

    if (typeof claims['sub'] !== 'string') {
      console.error(
        `Received cognito authorizer claim with invalid sub:`,
        request.cognitoAuthorizerClaim
      );
      return false;
    }

    request.cognitoAuthorizerClaim = claims as any;

    return true;
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

export const CognitoUserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<CognitoAuthRequest>();
    const claim = request.cognitoAuthorizerClaim;

    if (!claim) {
      throw new UnauthorizedException();
    }

    return claim.sub;
  }
);
