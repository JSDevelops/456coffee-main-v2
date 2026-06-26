import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from './jwt-payload';

/**
 * Inject the JWT payload (the authenticated user) into a controller method.
 * Returns null if the request is unauthenticated (e.g., a @Public() route).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | null => {
    const req = ctx.switchToHttp().getRequest();
    return req.user ?? null;
  },
);
