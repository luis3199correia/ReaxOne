import { BadRequestException } from '@nestjs/common';

export const DEFAULT_FACTURALUSA_API_URL = 'https://facturalusa.pt/api/v2';
const ERROR_MAX_LENGTH = 500;
const HTTP_NOT_FOUND = 404;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNPROCESSABLE = 422;

export interface FacturalusaConfig {
  apiKey: string;
  apiUrl: string;
}

export function readFacturalusaConfig(env: NodeJS.ProcessEnv = process.env): FacturalusaConfig {
  const url = env.FACTURALUSA_API_URL?.trim().replace(/\/+$/, '') ?? '';
  return {
    apiKey: env.FACTURALUSA_API_KEY?.trim() ?? '',
    // Só https: a chave vai no cabeçalho de cada pedido
    apiUrl: /^https:\/\//.test(url) ? url : DEFAULT_FACTURALUSA_API_URL,
  };
}

/**
 * ID do Facturalusa vindo do backoffice.
 * undefined = não mexer; null/'' = limpar; senão tem de ser um inteiro positivo.
 */
export function parseOptionalFacturalusaId(raw: unknown, errorMessage: string): number | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || (typeof raw === 'string' && raw.trim() === '')) return null;
  const text = typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw.trim() : '';
  if (!/^[1-9]\d*$/.test(text)) throw new BadRequestException(errorMessage);
  return Number(text);
}

/**
 * Mensagem de erro devolvida pela API. O formato do corpo de erro não está
 * documentado: aceita { message }, { error }, { errors: { campo: [..] } } ou texto.
 */
export function extractApiError(data: unknown): string | null {
  const text = rawApiError(data);
  return text ? text.slice(0, ERROR_MAX_LENGTH) : null;
}

/**
 * Resposta "não encontrado" dos endpoints de pesquisa (find). O formato não está
 * documentado: aceita 404 ou um 400/422 com mensagem do tipo "não foi encontrado".
 */
export function isNotFoundResponse(status: number | null, message: string | null): boolean {
  if (status === HTTP_NOT_FOUND) return true;
  const isClientError = status === HTTP_BAD_REQUEST || status === HTTP_UNPROCESSABLE;
  return isClientError && /n[aã]o (foi )?encontrad|not found/i.test(message ?? '');
}

/**
 * Erro de validação "o valor seleccionado para o campo id é inválido" (ex.: PUT
 * /items/:id com um ID que não existe nesta conta).
 */
export function isInvalidIdResponse(status: number | null, message: string | null): boolean {
  const isClientError = status === HTTP_BAD_REQUEST || status === HTTP_UNPROCESSABLE;
  return isClientError && /\bcampo id\b.*inv[aá]lid/i.test(message ?? '');
}

/**
 * Linha da venda com um artigo que o Facturalusa não reconhece (ex.: artigo
 * apagado lá, mas com o ID ainda guardado do nosso lado).
 */
export function isUnknownItemResponse(status: number | null, message: string | null): boolean {
  const isClientError = status === HTTP_BAD_REQUEST || status === HTTP_UNPROCESSABLE;
  return isClientError && /\bitems?(\.\d+\.|\s)id\b/i.test(message ?? '');
}

function rawApiError(data: unknown): string | null {
  if (typeof data === 'string') return data.trim() || null;
  if (!data || typeof data !== 'object') return null;
  const body = data as Record<string, unknown>;
  if (typeof body.message === 'string' && body.message.trim()) return body.message.trim();
  if (typeof body.error === 'string' && body.error.trim()) return body.error.trim();
  if (body.errors && typeof body.errors === 'object') {
    const messages = Object.values(body.errors as Record<string, unknown>)
      .flatMap((v) => (Array.isArray(v) ? v : [v]))
      .filter((v): v is string => typeof v === 'string' && v.trim() !== '');
    return messages.length > 0 ? messages.join('; ') : null;
  }
  return null;
}
