import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

function makeCtx(headers: Record<string, string> = {}): ExecutionContext {
  const req: { headers: Record<string, string>; user?: unknown } = { headers };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let jwt: JwtService;
  let reflector: Reflector;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jwt = { verify: jest.fn() } as unknown as JwtService;
    reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
    guard = new JwtAuthGuard(jwt, reflector);
  });

  it('allows public routes without a token', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    expect(guard.canActivate(makeCtx())).toBe(true);
  });

  it('rejects non-public routes without a token', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    expect(() => guard.canActivate(makeCtx())).toThrow(UnauthorizedException);
  });

  it('attaches verified payload to req.user when token is valid', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 'u1', role: 'CUSTOMER' });
    const ctx = makeCtx({ authorization: 'Bearer good-token' });
    expect(guard.canActivate(ctx)).toBe(true);
    const req = ctx.switchToHttp().getRequest() as { user: { sub: string } };
    expect(req.user.sub).toBe('u1');
  });

  it('rejects when bearer token fails to verify', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('jwt malformed');
    });
    const ctx = makeCtx({ authorization: 'Bearer bad-token' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('ignores non-Bearer schemes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const ctx = makeCtx({ authorization: 'Basic abc' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    expect(jwt.verify).not.toHaveBeenCalled();
  });
});
