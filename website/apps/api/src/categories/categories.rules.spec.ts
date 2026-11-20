import { BadRequestException } from '@nestjs/common';
import { parseFacturalusaCategoryId } from './categories.rules';

describe('parseFacturalusaCategoryId', () => {
  it('aceita um inteiro positivo (número ou texto)', () => {
    expect(parseFacturalusaCategoryId(86996)).toBe(86996);
    expect(parseFacturalusaCategoryId(' 86995 ')).toBe(86995);
  });

  it('vazio ou null limpa o valor', () => {
    expect(parseFacturalusaCategoryId(null)).toBeNull();
    expect(parseFacturalusaCategoryId('')).toBeNull();
  });

  it('ausente não altera o valor', () => {
    expect(parseFacturalusaCategoryId(undefined)).toBeUndefined();
  });

  it('recusa valores que não sejam um ID válido', () => {
    for (const bad of ['abc', -1, 0, 1.5, '12a', {}]) {
      expect(() => parseFacturalusaCategoryId(bad)).toThrow(BadRequestException);
    }
  });
});
