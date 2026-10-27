export class AdminProfileEntity {
  id: string;
  email: string;
  name: string;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export class LoginResultEntity {
  /** JWT for mobile/API clients (send as `Authorization: Bearer <token>`). Browsers also get it as an httpOnly cookie. */
  token: string;
  /** Token lifetime in seconds */
  expiresIn: number;
  admin: AdminProfileEntity;
}
