import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import type { JwtPayload } from './jwt-payload';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user: JwtPayload | undefined = ctx.switchToHttp().getRequest().user;
    if (!user) throw new ForbiddenException('Authentication required');
    if (!required.includes(user.role)) {
      throw new ForbiddenException(
        `Insufficient role: need one of ${required.join(', ')}`,
      );
    }
    return true;
  }
}
