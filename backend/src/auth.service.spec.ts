import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import type { PrismaService } from './prisma.service';
import { InMemoryOtpStore } from './auth/otp-store';
import type { SettingService } from './setting.service';

function makePrismaMock(overrides: Partial<Record<string, any>> = {}) {
  return {
    user: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    branch: { findUnique: jest.fn() },
    authProvider: { findUnique: jest.fn(), create: jest.fn() },
    ...overrides,
  } as unknown as PrismaService;
}

function makeJwtMock(): JwtService {
  return { sign: jest.fn().mockReturnValue('signed.jwt.token') } as unknown as JwtService;
}

function makeStore() {
  return new InMemoryOtpStore();
}

function makeSettingsMock(): SettingService {
  return {
    getOne: jest.fn().mockResolvedValue(null),
    setOne: jest.fn(),
  } as unknown as SettingService;
}

describe('AuthService.adminLogin', () => {
  const ORIGINAL = process.env;

  beforeEach(() => {
    process.env = {
      ...ORIGINAL,
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'right-password',
    };
  });

  afterAll(() => {
    process.env = ORIGINAL;
  });

  it('issues a token for valid creds', async () => {
    const svc = new AuthService(
      makePrismaMock(),
      makeJwtMock(),
      makeStore(),
      makeSettingsMock(),
    );
    const result = await svc.adminLogin('admin', 'right-password');
    expect(result.token).toBe('signed.jwt.token');
    expect(result.user.role).toBe('ADMIN');
  });

  it('rejects wrong password', async () => {
    const svc = new AuthService(
      makePrismaMock(),
      makeJwtMock(),
      makeStore(),
      makeSettingsMock(),
    );
    await expect(svc.adminLogin('admin', 'WRONG')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects unknown username', async () => {
    const svc = new AuthService(
      makePrismaMock(),
      makeJwtMock(),
      makeStore(),
      makeSettingsMock(),
    );
    await expect(svc.adminLogin('mallory', 'right-password')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

describe('AuthService.staffLogin', () => {
  const ORIGINAL = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL, POS_PIN: '4567' };
  });

  afterAll(() => {
    process.env = ORIGINAL;
  });

  it('rejects on bad PIN for an existing branch', async () => {
    const prisma = makePrismaMock();
    (prisma.branch.findUnique as jest.Mock).mockResolvedValue({
      id: 'branch-1',
      name: 'Main',
      managers: [],
    });
    const svc = new AuthService(
      prisma,
      makeJwtMock(),
      makeStore(),
      makeSettingsMock(),
    );
    await expect(svc.staffLogin('branch-1', 'WRONG')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prisma.branch.findUnique).toHaveBeenCalled();
  });

  it('rejects when branch does not exist', async () => {
    const prisma = makePrismaMock();
    (prisma.branch.findUnique as jest.Mock).mockResolvedValue(null);
    const svc = new AuthService(
      prisma,
      makeJwtMock(),
      makeStore(),
      makeSettingsMock(),
    );
    await expect(svc.staffLogin('ghost', '4567')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('issues a STAFF token bound to the branch', async () => {
    const prisma = makePrismaMock();
    (prisma.branch.findUnique as jest.Mock).mockResolvedValue({
      id: 'branch-1',
      name: 'Main',
      managers: [],
    });
    const svc = new AuthService(
      prisma,
      makeJwtMock(),
      makeStore(),
      makeSettingsMock(),
    );
    const result = await svc.staffLogin('branch-1', '4567');
    expect(result.user.role).toBe('STAFF');
    expect(result.user.branchId).toBe('branch-1');
    expect(result.token).toBe('signed.jwt.token');
  });
});
