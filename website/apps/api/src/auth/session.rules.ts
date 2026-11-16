import { createHash } from 'crypto';

/** Sessões de admin duram menos: um cookie roubado dá acesso ao backoffice por pouco tempo. */
export const ADMIN_TOKEN_TTL = '12h' as const;
const ADMIN_ROLE = 'ADMIN';
const FINGERPRINT_LENGTH = 16;

export interface SessionPayload {
  sub: string;
  email?: string;
  role?: string;
  pwh?: string;   // impressão digital do hash da password no momento do login
  type?: string;  // 'password-reset' nos links de reposição
}

export interface SessionDbUser {
  id: string;
  email: string;
  role: string;
  password: string;
}

/** Impressão digital do hash atual da password (não revela o hash). */
export function passwordFingerprint(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('hex').slice(0, FINGERPRINT_LENGTH);
}

/**
 * Valida a sessão contra a base de dados: o utilizador tem de existir, a password
 * não pode ter mudado desde o login e o papel vem sempre da BD (não do token).
 */
export function sessionUser(payload: SessionPayload, user: SessionDbUser | null) {
  if (!user || payload.type) return null;
  if (!payload.pwh || payload.pwh !== passwordFingerprint(user.password)) return null;
  return { id: user.id, email: user.email, role: user.role };
}

/** Validade do token por papel; undefined = valor por omissão (JWT_EXPIRES_IN). */
export function tokenTtl(role: string): typeof ADMIN_TOKEN_TTL | undefined {
  return role === ADMIN_ROLE ? ADMIN_TOKEN_TTL : undefined;
}
