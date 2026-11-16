import { ADMIN_TOKEN_TTL, passwordFingerprint, sessionUser, tokenTtl } from './session.rules';

const HASH = '$2b$10$abcdefghijklmnopqrstuv';
const USER = { id: 'u1', email: 'a@b.pt', role: 'ADMIN', password: HASH };

function payload(overrides: Record<string, unknown> = {}) {
  return { sub: 'u1', email: 'a@b.pt', role: 'ADMIN', pwh: passwordFingerprint(HASH), ...overrides };
}

describe('sessionUser', () => {
  it('sessão válida: devolve o utilizador com o papel da base de dados', () => {
    expect(sessionUser(payload({ role: 'ADMIN' }), { ...USER, role: 'CUSTOMER' }))
      .toEqual({ id: 'u1', email: 'a@b.pt', role: 'CUSTOMER' });
  });

  it('utilizador apagado: sessão inválida', () => {
    expect(sessionUser(payload(), null)).toBeNull();
  });

  it('password mudou desde o login: sessão inválida', () => {
    expect(sessionUser(payload(), { ...USER, password: '$2b$10$outrohash' })).toBeNull();
  });

  it('token sem impressão digital (emitido antes desta versão): sessão inválida', () => {
    expect(sessionUser(payload({ pwh: undefined }), USER)).toBeNull();
  });

  it('token de reposição de password não serve como sessão', () => {
    expect(sessionUser(payload({ type: 'password-reset' }), USER)).toBeNull();
  });
});

describe('tokenTtl', () => {
  it('admin tem sessões mais curtas; clientes usam o valor por omissão', () => {
    expect(tokenTtl('ADMIN')).toBe(ADMIN_TOKEN_TTL);
    expect(tokenTtl('CUSTOMER')).toBeUndefined();
  });
});
