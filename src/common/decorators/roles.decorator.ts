import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../../generated/prisma/client';

export const ROLES_KEY = 'roles';

/** Every role, for routes any signed-in admin may use (profile, dashboard). */
export const ALL_ROLES = Object.values(AdminRole);

/**
 * Roles allowed on a route in addition to ADMIN, who can access everything.
 * Routes without @Roles() are ADMIN-only.
 */
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
