import { ExecutionContext } from '@nestjs/common';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

// Rotas sensíveis (brute force / spam / abuso de email) — limite mais apertado.
// Definido aqui em vez de @Throttle nos controllers para ficar tudo num só sítio.
const SENSITIVE_ROUTES = new Set([
  'POST /api/auth/login',
  'POST /api/auth/register',
  'POST /api/auth/forgot-password',
  'POST /api/auth/reset-password',
  'POST /api/contact',
  'POST /api/orders',
]);

const ONE_MINUTE = 60_000;

function isSensitive(context: ExecutionContext): boolean {
  const req = context.switchToHttp().getRequest();
  const path = String(req?.path ?? '').replace(/\/+$/, '');
  return SENSITIVE_ROUTES.has(`${req?.method} ${path}`);
}

export const throttlerOptions: ThrottlerModuleOptions = [
  // Limite global modesto, por IP e por rota
  { name: 'default', ttl: ONE_MINUTE, limit: 300 },
  // Limite estrito, só aplicado às rotas sensíveis
  { name: 'strict', ttl: ONE_MINUTE, limit: 10, skipIf: (ctx) => !isSensitive(ctx) },
];
