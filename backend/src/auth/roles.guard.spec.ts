import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import type { JwtPayload } from './jwt-payload';

function makeCtx(user: JwtPayload | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
    guard = new RolesGuard(reflector);
  });

  it('passes through when no @Roles is set', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(makeCtx({ sub: 'x', role: 'CUSTOMER' }))).toBe(
      true,
    );
  });

  it('passes through when role matches', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'STAFF',
      'ADMIN',
    ]);
    expect(guard.canActivate(makeCtx({ sub: 'x', role: 'STAFF' }))).toBe(true);
  });

  it('rejects when role does not match', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    expect(() =>
      guard.canActivate(makeCtx({ sub: 'x', role: 'CUSTOMER' })),
    ).toThrow(ForbiddenException);
  });

  it('rejects when user is missing entirely', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(makeCtx(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
