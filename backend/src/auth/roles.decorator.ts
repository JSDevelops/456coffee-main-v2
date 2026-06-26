import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to one or more roles.
 * Used together with RolesGuard. Routes without @Roles are accessible to any
 * authenticated user.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
