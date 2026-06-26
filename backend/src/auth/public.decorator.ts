import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public — JwtAuthGuard will skip it.
 * Use on login, OTP, health, public catalog endpoints.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
