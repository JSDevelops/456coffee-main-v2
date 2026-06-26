import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { PrismaService } from './prisma.service';
import type { User } from '@prisma/client';
import type { JwtPayload } from './auth/jwt-payload';
import { OtpStore } from './auth/otp-store';
import { SettingService } from './setting.service';
import { hashPassword, verifyPassword } from './auth/password';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private otpStore: OtpStore,
    private settings: SettingService,
  ) {}

  /** Sign a short-lived JWT for a user. */
  signTokenFor(user: Pick<User, 'id' | 'role'>): string {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return this.jwt.sign(payload);
  }

  /**
   * Admin login. Username/password come from settings if set
   * (admin.username, admin.passwordHash), otherwise fall back to env
   * (ADMIN_USERNAME, ADMIN_PASSWORD). Once the admin changes their
   * password via /admin-change-password the env values become inactive.
   */
  async adminLogin(username: string, password: string) {
    const storedUser = await this.settings.getOne('admin.username');
    const storedHash = await this.settings.getOne('admin.passwordHash');

    const expectedUser = storedUser || process.env.ADMIN_USERNAME || 'admin';

    let passwordOk = false;
    if (storedHash) {
      passwordOk = verifyPassword(password, storedHash);
    } else {
      const expectedPass = process.env.ADMIN_PASSWORD || 'changeme123';
      passwordOk = password === expectedPass;
    }

    if (username !== expectedUser || !passwordOk) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const displayName =
      (await this.settings.getOne('admin.displayName')) || username;
    const payload: JwtPayload = { sub: 'system-admin', role: 'ADMIN' };
    return {
      token: this.jwt.sign(payload),
      user: { id: 'system-admin', role: 'ADMIN', name: displayName },
    };
  }

  /** Read admin profile fields from settings (with env fallback for username). */
  async getAdminProfile() {
    const [username, displayName, email, phone, hash] = await Promise.all([
      this.settings.getOne('admin.username'),
      this.settings.getOne('admin.displayName'),
      this.settings.getOne('admin.email'),
      this.settings.getOne('admin.phone'),
      this.settings.getOne('admin.passwordHash'),
    ]);
    return {
      username: username || process.env.ADMIN_USERNAME || 'admin',
      displayName: displayName || 'Super Admin',
      email: email || '',
      phone: phone || '',
      hasCustomPassword: !!hash,
    };
  }

  async updateAdminProfile(data: {
    username?: string;
    displayName?: string;
    email?: string;
    phone?: string;
  }) {
    if (data.username !== undefined) {
      const trimmed = data.username.trim();
      if (!trimmed) throw new BadRequestException('Username cannot be empty');
      await this.settings.setOne('admin.username', trimmed);
    }
    if (data.displayName !== undefined) {
      await this.settings.setOne('admin.displayName', data.displayName.trim());
    }
    if (data.email !== undefined) {
      await this.settings.setOne('admin.email', data.email.trim());
    }
    if (data.phone !== undefined) {
      await this.settings.setOne('admin.phone', data.phone.trim());
    }
    return this.getAdminProfile();
  }

  /**
   * Change the admin password. The current password must match either
   * the stored hash or the env ADMIN_PASSWORD (for the very first change).
   */
  async changeAdminPassword(currentPassword: string, newPassword: string) {
    if (newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }
    const storedHash = await this.settings.getOne('admin.passwordHash');
    let currentOk = false;
    if (storedHash) {
      currentOk = verifyPassword(currentPassword, storedHash);
    } else {
      const expectedPass = process.env.ADMIN_PASSWORD || 'changeme123';
      currentOk = currentPassword === expectedPass;
    }
    if (!currentOk) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.settings.setOne('admin.passwordHash', hashPassword(newPassword));
    return { success: true };
  }

  /**
   * Branch staff login.
   * 1) Match against any active BranchManager.pin for this branch (per-staff PIN)
   * 2) Fallback to shared env POS_PIN (legacy / setup-time).
   * The returned JWT carries branchId so guards can enforce branch-scope.
   */
  async staffLogin(branchId: string, pin: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        managers: {
          where: { isActive: true },
          select: { id: true, name: true, role: true, pin: true },
        },
      },
    });
    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    // 1. Per-staff PIN
    const staff = branch.managers.find((m) => m.pin && m.pin === pin);
    if (staff) {
      // Branch managers get a JWT role of MANAGER so they can access the
      // dashboard / refund / shift endpoints. Other staff get STAFF.
      const jwtRole = staff.role === 'BRANCH_MANAGER' ? 'MANAGER' : 'STAFF';
      const payload: JwtPayload = {
        sub: `staff-${staff.id}`,
        role: jwtRole,
        branchId,
      };
      return {
        token: this.jwt.sign(payload),
        user: {
          id: staff.id,
          name: staff.name,
          role: jwtRole,
          staffRole: staff.role,
          branchId,
          branchName: branch.name,
        },
      };
    }

    // 2. Legacy env PIN
    const expectedPin = process.env.POS_PIN || '4567';
    if (pin === expectedPin) {
      const payload: JwtPayload = {
        sub: `branch-${branchId}`,
        role: 'STAFF',
        branchId,
      };
      return {
        token: this.jwt.sign(payload),
        user: {
          id: `branch-${branchId}`,
          role: 'STAFF',
          branchId,
          branchName: branch.name,
        },
      };
    }

    throw new UnauthorizedException('Invalid PIN');
  }

  // ─── OTP Logic ──────────────────────────────────────────────────────────
  async sendOtp(phone: string) {
    const mockEnabled = (await this.settings.getOne('secret.login.sms.mockEnabled')) !== 'false';
    const code = mockEnabled ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 mins
    await this.otpStore.set(phone, { code, expires });

    if (mockEnabled) {
      console.log(`[AUTH] Mock OTP for ${phone}: ${code}`);
      return { success: true, message: 'OTP sent successfully (Check console)' };
    }

    const apiUrl = await this.settings.getOne('secret.login.sms.apiUrl');
    const apiKey = await this.settings.getOne('secret.login.sms.apiKey');
    const sender = (await this.settings.getOne('login.sms.sender')) || '456COFFEE';

    if (!apiUrl) {
      throw new BadRequestException('SMS Gateway API URL is not configured');
    }

    try {
      await axios.post(apiUrl, {
        apiKey,
        sender,
        phone,
        message: `รหัส OTP สำหรับเข้าสู่ระบบ 456 Coffee ของคุณคือ ${code} (ใช้งานได้ใน 5 นาที)`,
      });
      return { success: true, message: 'OTP sent successfully via SMS Gateway' };
    } catch (err: any) {
      console.error('Failed to send SMS OTP:', err.message);
      throw new BadRequestException(`Failed to send SMS OTP: ${err.message}`);
    }
  }

  async verifyOtp(
    phone: string,
    inputCode: string,
    metadata?: { name?: string },
  ) {
    const record = await this.otpStore.get(phone);
    if (!record) {
      throw new BadRequestException('OTP expired or not found');
    }
    if (record.code !== inputCode) {
      throw new BadRequestException('Invalid OTP code');
    }

    await this.otpStore.delete(phone);

    let user = await this.prisma.user.findFirst({ where: { phone } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          name: metadata?.name || 'Customer',
          authProviders: {
            create: { provider: 'PHONE', providerId: phone },
          },
        },
      });
    }

    return { user, token: this.signTokenFor(user) };
  }

  // ─── LINE Login ─────────────────────────────────────────────────────────
  async loginWithLine(input: {
    lineUid?: string;
    accessToken?: string;
    displayName?: string;
    pictureUrl?: string;
    email?: string;
  }) {
    const profile = await this.resolveLineProfile(input);
    const lineUid = profile.lineUid;

    // 1. Existing LINE provider?
    const provider = await this.prisma.authProvider.findUnique({
      where: { providerId: lineUid },
      include: { user: true },
    });

    if (provider) {
      return { user: provider.user, token: this.signTokenFor(provider.user) };
    }

    // 2. Link by email if a user with that email already exists
    if (profile.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });
      if (existingUser) {
        await this.prisma.authProvider.create({
          data: {
            userId: existingUser.id,
            provider: 'LINE',
            providerId: lineUid,
          },
        });
        return { user: existingUser, token: this.signTokenFor(existingUser) };
      }
    }

    // 3. New user
    const user = await this.prisma.user.create({
      data: {
        name: profile.displayName,
        email: profile.email,
        authProviders: {
          create: { provider: 'LINE', providerId: lineUid },
        },
      },
    });
    return { user, token: this.signTokenFor(user) };
  }

  // ─── Google Login ───────────────────────────────────────────────────────
  async loginWithGoogle(input: {
    idToken?: string;
    accessToken?: string;
    googleId?: string;
    displayName?: string;
    email?: string;
    pictureUrl?: string;
  }) {
    const profile = await this.resolveGoogleProfile(input);
    const googleId = profile.googleId;

    // 1. Existing Google provider?
    const provider = await this.prisma.authProvider.findFirst({
      where: { provider: 'GOOGLE', providerId: googleId },
      include: { user: true },
    });

    if (provider) {
      return { user: provider.user, token: this.signTokenFor(provider.user) };
    }

    // 2. Link by email if a user with that email already exists
    if (profile.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });
      if (existingUser) {
        await this.prisma.authProvider.create({
          data: {
            userId: existingUser.id,
            provider: 'GOOGLE',
            providerId: googleId,
          },
        });
        return { user: existingUser, token: this.signTokenFor(existingUser) };
      }
    }

    // 3. New user
    const user = await this.prisma.user.create({
      data: {
        name: profile.displayName || 'Google Customer',
        email: profile.email,
        authProviders: {
          create: { provider: 'GOOGLE', providerId: googleId },
        },
      },
    });
    return { user, token: this.signTokenFor(user) };
  }

  private async resolveGoogleProfile(input: {
    idToken?: string;
    accessToken?: string;
    googleId?: string;
    displayName?: string;
    email?: string;
    pictureUrl?: string;
  }): Promise<{
    googleId: string;
    displayName: string;
    email?: string;
    pictureUrl?: string;
  }> {
    const isProd = process.env.NODE_ENV === 'production';

    if (input.idToken) {
      const verify = await axios.get<{
        sub: string;
        email?: string;
        name?: string;
        picture?: string;
        aud?: string;
      }>(`https://oauth2.googleapis.com/tokeninfo`, {
        params: { id_token: input.idToken },
      });

      const expectedClientId = await this.settings.getOne('login.google.clientId') || process.env.GOOGLE_CLIENT_ID;
      if (expectedClientId && verify.data.aud !== expectedClientId) {
        throw new UnauthorizedException('Google ID token client_id mismatch');
      }

      return {
        googleId: verify.data.sub,
        displayName: verify.data.name || 'Google User',
        email: verify.data.email,
        pictureUrl: verify.data.picture,
      };
    }

    if (input.accessToken) {
      const googleProfile = await axios.get<{
        sub: string;
        name?: string;
        given_name?: string;
        family_name?: string;
        picture?: string;
        email?: string;
        email_verified?: boolean;
      }>('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${input.accessToken}` },
      });

      return {
        googleId: googleProfile.data.sub,
        displayName: googleProfile.data.name || googleProfile.data.given_name || 'Google User',
        email: googleProfile.data.email,
        pictureUrl: googleProfile.data.picture,
      };
    }

    if (isProd) {
      throw new UnauthorizedException('Google ID Token or Access Token is required');
    }

    if (!input.googleId || !input.email) {
      throw new BadRequestException('googleId and email are required for mock login');
    }

    return {
      googleId: input.googleId,
      displayName: input.displayName || 'Mock Google User',
      email: input.email,
      pictureUrl: input.pictureUrl,
    };
  }

  private async resolveLineProfile(input: {
    lineUid?: string;
    accessToken?: string;
    displayName?: string;
    pictureUrl?: string;
    email?: string;
  }): Promise<{
    lineUid: string;
    displayName: string;
    pictureUrl?: string;
    email?: string;
  }> {
    const isProd = process.env.NODE_ENV === 'production';

    if (input.accessToken) {
      const verify = await axios.get<{
        client_id?: string;
        expires_in?: number;
      }>('https://api.line.me/oauth2/v2.1/verify', {
        params: { access_token: input.accessToken },
      });

      const expectedChannelId = process.env.LINE_CHANNEL_ID;
      if (expectedChannelId && verify.data.client_id !== expectedChannelId) {
        throw new UnauthorizedException('LINE token channel mismatch');
      }

      const lineProfile = await axios.get<{
        userId: string;
        displayName: string;
        pictureUrl?: string;
      }>('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${input.accessToken}` },
      });

      return {
        lineUid: lineProfile.data.userId,
        displayName: lineProfile.data.displayName,
        pictureUrl: lineProfile.data.pictureUrl,
        email: input.email,
      };
    }

    if (isProd) {
      throw new UnauthorizedException('LINE access token is required');
    }

    if (!input.lineUid || !input.displayName) {
      throw new BadRequestException('lineUid and displayName are required');
    }

    return {
      lineUid: input.lineUid,
      displayName: input.displayName,
      pictureUrl: input.pictureUrl,
      email: input.email,
    };
  }

  // ─── Account Linking ────────────────────────────────────────────────────
  async linkProvider(userId: string, provider: string, providerId: string) {
    const existing = await this.prisma.authProvider.findUnique({
      where: { providerId },
    });
    if (existing) {
      if (existing.userId === userId) return; // Already linked
      throw new BadRequestException(
        'This account is already linked to another user',
      );
    }

    await this.prisma.authProvider.create({
      data: { userId, provider, providerId },
    });
  }
}
