export interface JwtPayload {
  sub: string; // user.id (or "system-admin" / "branch-<id>")
  role: string; // CUSTOMER | STAFF | ADMIN | APP
  branchId?: string; // populated on STAFF tokens, and sometimes legacy APP tokens
  deviceId?: string; // populated on APP tokens for payment forwarder devices
  iat?: number;
  exp?: number;
}
