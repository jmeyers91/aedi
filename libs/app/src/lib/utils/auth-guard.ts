import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UseGuards,
  createParamDecorator,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

export type AuthRequest = Request & { userId: string };
export type MaybeAuthRequest = Request & { userId?: string };

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.headers.authorization;

    if (!userId) {
      return false;
    }

    (request as AuthRequest).userId = userId;
    return true;
  }
}

export function RequireAuth() {
  return UseGuards(AuthGuard);
}

export const UserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<MaybeAuthRequest>();
    const userId = request.userId;

    if (!userId) {
      throw new UnauthorizedException();
    }

    return userId;
  }
);
