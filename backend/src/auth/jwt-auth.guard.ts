import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { JwtPayload } from './jwt-payload';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const req = ctx.switchToHttp().getRequest();
    const token = this.extractToken(req.headers?.authorization);

    if (token) {
      try {
        req.user = this.jwt.verify<JwtPayload>(token);
      } catch {
        // Invalid/expired token. Public routes still allowed; protected routes fail below.
      }
    }

    if (isPublic) return true;
    if (!req.user) throw new UnauthorizedException('Missing or invalid token');
    return true;
  }

  private extractToken(header?: string): string | null {
    if (!header) return null;
    const [type, value] = header.split(' ');
    return type === 'Bearer' && value ? value : null;
  }
}
