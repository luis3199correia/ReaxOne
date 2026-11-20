import { parseOptionalFacturalusaId } from '../invoicing/facturalusa.rules';

/** ID da categoria no Facturalusa vindo do backoffice (undefined = não mexer, null = limpar). */
export function parseFacturalusaCategoryId(raw: unknown): number | null | undefined {
  return parseOptionalFacturalusaId(raw, 'ID da categoria no Facturalusa inválido.');
}
