import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { FacturalusaConfig, extractApiError, isNotFoundResponse, readFacturalusaConfig } from './facturalusa.rules';
import type { CustomerType, SalePayload } from './invoice-rules';

const REQUEST_TIMEOUT_MS = 15_000;
const HTTP_NOT_FOUND = 404;
const HTTP_TOO_MANY_REQUESTS = 429;

/** Erro da API do Facturalusa, com a mensagem devolvida por eles (quando existe). */
export class FacturalusaError extends Error {
  constructor(message: string, readonly status: number | null) {
    super(message);
    this.name = 'FacturalusaError';
  }
}

export interface FacturalusaSale {
  id: number;
  number: number | null;
  document_full_number: string | null;
  url_file: string | null;
  grand_total: number | string | null;
  status: string | null;
  at_success?: boolean | null;
  at_message?: string | null;
}

interface CustomerInput {
  name: string;
  vat_number: string;
  type: CustomerType;
  vat_type: string;
  country?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  email?: string;
}

interface ArticleInput {
  reference: string;
  description: string;
  unit: string;
  vat: number;
  type: string;
}

/**
 * Cliente HTTP mínimo da API v2 do Facturalusa (https://facturalusa.pt/api/v2).
 * Limite diário de pedidos por plano: os IDs devolvidos devem ser guardados
 * localmente e os endpoints de pesquisa (find) usados só pontualmente.
 */
@Injectable()
export class FacturalusaClient {
  private readonly logger = new Logger(FacturalusaClient.name);

  get config(): FacturalusaConfig {
    return readFacturalusaConfig();
  }

  get isConfigured(): boolean {
    return this.config.apiKey !== '';
  }

  /** ID do cliente com este NIF, ou null se não existir. */
  async findCustomerByVat(vatNumber: string): Promise<number | null> {
    return this.findId('/customers/find', { value: vatNumber, search_in: 'Vat Number' });
  }

  async createCustomer(input: CustomerInput): Promise<number> {
    return this.requireId(await this.request('/customers', input), 'cliente');
  }

  /** ID do artigo com esta referência, ou null se não existir. */
  async findItemByReference(reference: string): Promise<number | null> {
    return this.findId('/items/find', { value: reference, search_in: 'Reference' });
  }

  async createItem(input: ArticleInput): Promise<number> {
    return this.requireId(await this.request('/items', input), 'artigo');
  }

  /** Cria a venda. Com external_reference repetida, o Facturalusa devolve a venda já existente. */
  async createSale(payload: SalePayload): Promise<FacturalusaSale> {
    const data = await this.request('/sales', payload);
    this.requireId(data, 'venda');
    return data as FacturalusaSale;
  }

  /** Envia o documento (Terminado) por email para o comprador. */
  async sendSaleEmail(saleId: number, to: { name: string; email: string }): Promise<void> {
    await this.request(`/sales/${saleId}/send_email`, { to: [to] });
  }

  private async findId(path: string, body: Record<string, unknown>): Promise<number | null> {
    try {
      const data = await this.request(path, body);
      return typeof data?.id === 'number' ? data.id : null;
    } catch (e) {
      if (e instanceof FacturalusaError && isNotFoundResponse(e.status, e.message)) return null;
      throw e;
    }
  }

  private requireId(data: any, what: string): number {
    if (typeof data?.id !== 'number') throw new FacturalusaError(`Resposta inválida ao criar ${what}.`, null);
    return data.id;
  }

  private async request(path: string, body: unknown): Promise<any> {
    const { apiKey, apiUrl } = this.config;
    if (!apiKey) throw new FacturalusaError('FACTURALUSA_API_KEY não configurada.', null);
    try {
      const res = await axios.post(`${apiUrl}${path}`, body, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          Authorization:  `Bearer ${apiKey}`,
          Accept:         'application/json',
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    } catch (e) {
      throw this.toError(e, path);
    }
  }

  private toError(e: unknown, path: string): FacturalusaError {
    const err = e as AxiosError;
    const status = err?.response?.status ?? null;
    const apiMessage = extractApiError(err?.response?.data);
    const message = status === HTTP_TOO_MANY_REQUESTS
      ? 'Limite diário de pedidos à API do Facturalusa atingido.'
      : apiMessage ?? `Erro na API do Facturalusa (${status ?? err?.code ?? 'sem resposta'}).`;
    // Nunca registar cabeçalhos: levam a chave
    if (status !== HTTP_NOT_FOUND) this.logger.warn(`[Faturação] POST ${path} falhou (${status ?? err?.code ?? 'sem resposta'}): ${message}`);
    return new FacturalusaError(message, status);
  }
}
