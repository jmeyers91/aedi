import {
  Injectable,
  CanActivate,
  ExecutionContext,
  applyDecorators,
  SetMetadata,
  UseGuards,
  createParamDecorator,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserPoolId } from '@sep6/constants';
import { getCurrentInvoke } from '@vendia/serverless-express';
import {
  APIGatewayProxyCognitoAuthorizer,
  APIGatewayProxyEventBase,
} from 'aws-lambda';
import { NestResourceNode } from '../reflect-utils';
import { ResourceType } from './resource-module';

export const COGNITO_AUTHORIZER = Symbol('COGNITO_AUTHORIZER');
export const DISABLE_COGNITO_AUTHORIZER = Symbol('DISABLE_COGNITO_AUTHORIZER');

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
    try {
      const request = context.switchToHttp().getRequest<CognitoAuthRequest>();
      const invoke = getCurrentInvoke();
      const event: APIGatewayProxyEventBase<APIGatewayProxyCognitoAuthorizer> =
        invoke.event;
      const claims = event?.requestContext?.authorizer?.claims;

      if (!claims) {
        if (shouldSkipAuthCheck(event)) {
          return true;
        }
        return false;
      }

      if (typeof claims['sub'] !== 'string') {
        console.error(
          `Received cognito authorizer claim with invalid sub:`,
          request.cognitoAuthorizerClaim
        );
        return false;
      }

      request.cognitoAuthorizerClaim = claims as any;

      return true;
    } catch (error) {
      console.log('Caught', error);
      throw new BadRequestException((error as any).message);
    }
  }
}

export function CognitoGuard(userPool: UserPoolId) {
  const cognitoAuthorizerRouteMetadata: CognitoAuthorizerRouteMetadata = {
    userPool,
  };
  return applyDecorators(
    SetMetadata(COGNITO_AUTHORIZER, cognitoAuthorizerRouteMetadata),
    UseGuards(CognitoAuthorizerGuard)
  );
}

export function DisableCognitoGuard() {
  return SetMetadata(DISABLE_COGNITO_AUTHORIZER, true);
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

/**
 * Skips the auth check for the current request if the API gateway route doesn't
 * include a cognito authorizer.
 * This may not be 100% necessary because auth checks are handled by cognito authorizer, so
 * if we should be able to ignore missing claims, but this makes double sure that the route shouldn't
 * have an authorizer enabled.
 */
function shouldSkipAuthCheck(
  event: APIGatewayProxyEventBase<APIGatewayProxyCognitoAuthorizer>
): boolean {
  if (!process.env['NEST_LAMBDA_RESOURCE']) {
    return false;
  }
  const lambdaResource = JSON.parse(
    process.env['NEST_LAMBDA_RESOURCE']
  ) as Pick<
    NestResourceNode<ResourceType.LAMBDA_FUNCTION>,
    'resourceMetadata' | 'controllers'
  >;
  const eventResourcePath = event.requestContext.resourcePath;

  for (const controller of lambdaResource.controllers) {
    for (const route of controller.routes) {
      if (
        !route.cognitoAuthorizer &&
        route.apiGatewayPath === eventResourcePath
      ) {
        return true;
      }
    }
  }

  return false;
}
