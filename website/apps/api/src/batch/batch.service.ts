import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';

const BASE_URL = 'https://mybatch.itsabatch.com/api/dispatch';
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const MESSAGE_MAX = 300;

function toForm(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return form;
}

/** Mensagem de erro da Batch (": …"), ou '' se não houver. */
function batchMessage(data: any): string {
  const message = typeof data?.message === 'string' ? data.message : typeof data === 'string' ? data : '';
  return message.trim() ? `: ${message.trim().slice(0, MESSAGE_MAX)}` : '';
}

export interface BatchShippingMethod {
  id: string;
  name: string;
  price: number;
  delivery_days?: string;
}

export interface BatchOrderPayload {
  phone: string;
  email: string;
  clientname: string;
  address: string;
  door?: string;
  floor?: string;
  zipcode: string;
  city: string;
  country?: string;
  obs?: string;
  external_id: string;
  weight: number;       // gramas
  volumes: number;
  total: number;
  cart: Record<string, number>; // { "nome // sku": quantidade }
  platform?: string;   // sobrepõe BATCH_PLATFORM se fornecido
}

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);
  /**
   * Token em memória. A Batch não indica validade, e cada /token/generate
   * invalida o token anterior — por isso só se gera um novo quando a API
   * responde 401, e um único pedido de cada vez (partilhado por quem espera).
   */
  private tokenPromise: Promise<string> | null = null;

  private get credentials() {
    return {
      email:    process.env.BATCH_EMAIL    || '',
      password: process.env.BATCH_PASSWORD || '',
      store:    process.env.BATCH_STORE_ID || '1',
      platform: process.env.BATCH_PLATFORM || '3',
    };
  }

  private getToken(): Promise<string> {
    if (!this.tokenPromise) {
      this.tokenPromise = this.generateToken().catch((err) => {
        this.tokenPromise = null; // a próxima chamada volta a tentar
        throw err;
      });
    }
    return this.tokenPromise;
  }

  private async generateToken(): Promise<string> {
    const form = new FormData();
    form.append('email', this.credentials.email);
    form.append('password', this.credentials.password);

    const res = await axios.post(`${BASE_URL}/token/generate`, form, {
      headers: form.getHeaders(),
    });

    // A resposta pode ser { token: '...' } ou { data: { token: '...' } }
    const token = res.data?.token || res.data?.data?.token;
    if (!token || typeof token !== 'string') {
      throw new Error(`Batch: token inválido na resposta${batchMessage(res.data)}`);
    }
    this.logger.log('Batch: novo token gerado');
    return token;
  }

  /** Esquece o token, se ainda for o mesmo que falhou (outro pedido pode já ter gerado um novo). */
  private invalidateToken(failed: Promise<string>) {
    if (this.tokenPromise === failed) this.tokenPromise = null;
  }

  /**
   * Pedido autenticado. Com 401 gera um token novo e repete uma vez.
   * Erros devolvidos com HTTP 200 e { error: true } também lançam, com a mensagem da Batch.
   */
  private async call(method: 'get' | 'post', path: string, fields?: Record<string, string>): Promise<any> {
    for (let attempt = 0; ; attempt += 1) {
      const tokenPromise = this.getToken();
      const token = await tokenPromise;
      const form = fields ? toForm(fields) : null;
      const res = await axios.request({
        method,
        url: `${BASE_URL}${path}`,
        data: form ?? undefined,
        headers: { ...(form ? form.getHeaders() : {}), 'Api-Auth': `Bearer ${token}` },
        validateStatus: () => true,
      });

      if (res.status === HTTP_UNAUTHORIZED && attempt === 0) {
        this.logger.warn(`Batch ${path}: token recusado (401) — a gerar um novo`);
        this.invalidateToken(tokenPromise);
        continue;
      }
      if (res.status >= HTTP_BAD_REQUEST || res.data?.error === true) {
        throw new Error(`Batch ${path} falhou (HTTP ${res.status})${batchMessage(res.data)}`);
      }
      return res.data;
    }
  }

  /** Admin/debug: resposta em bruto de um POST à API da Batch. */
  async postRaw(path: string, fields: Record<string, string>): Promise<any> {
    return this.call('post', path, fields);
  }

  // ─── Métodos de envio para um código postal ───────────────────────────────
  async getShippingMethods(zipcode: string): Promise<BatchShippingMethod[]> {
    try {
      const data = await this.call('post', '/zipcode/methods', { zipcode });

      // Formato: { error: false, shipping_methods: [{ id, name }] }
      const items: any[] = data?.shipping_methods || [];

      if (items.length === 0) return [{ id: 'standard', name: 'Envio Standard', price: 3.99 }];

      // Exclui métodos internos que não devem aparecer no checkout
      const excluded = ['returns', 'return'];
      const filtered = items.filter(
        (m) => !excluded.includes((m.name || '').toLowerCase()),
      );

      return filtered.map((m: any) => ({
        id:    String(m.id),
        name:  m.name,
        price: 0, // A Batch não devolve preços por método — configurar conforme necessário
      }));
    } catch (err) {
      this.logger.warn(`Batch getShippingMethods error: ${err.message}`);
      return [{ id: 'standard', name: 'Envio Standard', price: 3.99 }];
    }
  }

  // ─── Criar encomenda na Batch ─────────────────────────────────────────────
  async createOrder(payload: BatchOrderPayload): Promise<string | null> {
    try {
      const fields: Record<string, string> = {
        phone:       payload.phone,
        email:       payload.email,
        clientname:  payload.clientname,
        address:     payload.address,
        door:        payload.door || '',
        floor:       payload.floor || '',
        zipcode:     payload.zipcode,
        city:        payload.city,
        country:     payload.country || 'Portugal',
        obs:         payload.obs || '',
        external_id: payload.external_id,
        platform:    payload.platform || this.credentials.platform,
        weight:      String(payload.weight),
        volumes:     String(payload.volumes),
        total:       String(payload.total),
        status:      'pronta para recolha',
      };
      // store é opcional — só enviar se estiver configurado
      if (this.credentials.store && this.credentials.store !== '0') fields.store = this.credentials.store;
      // cart: { "nome // sku": quantidade }
      for (const [key, qty] of Object.entries(payload.cart)) fields[`cart[${key}]`] = String(qty);

      const data = await this.call('post', '/order/create', fields);
      const orderNumber = data?.order_number || data?.data?.order_number;
      this.logger.log(`Batch order criada: ${orderNumber} (encomenda ${payload.external_id})`);
      return orderNumber || null;
    } catch (err) {
      this.logger.error(`Batch createOrder (encomenda ${payload.external_id}): ${err.message}`);
      return null;
    }
  }

  // ─── Estado da encomenda ──────────────────────────────────────────────────
  async getOrderStatus(orderNumber: string) {
    try {
      const data = await this.call('post', '/order/status', { order_number: orderNumber });
      return data?.data || data;
    } catch (err) {
      this.logger.warn(`Batch getOrderStatus error: ${err.message}`);
      return null;
    }
  }

  // ─── Tracking da encomenda ────────────────────────────────────────────────
  async getOrderTracking(orderNumber: string) {
    try {
      const data = await this.call('post', '/order/tracking', { order_number: orderNumber });
      return data?.data || data;
    } catch (err) {
      this.logger.warn(`Batch getOrderTracking error: ${err.message}`);
      return null;
    }
  }

  // ─── Mudar estado ─────────────────────────────────────────────────────────
  async changeOrderStatus(orderNumber: string, status: string) {
    try {
      return await this.call('post', '/order/status/change', { order_number: orderNumber, status });
    } catch (err) {
      this.logger.warn(`Batch changeOrderStatus error: ${err.message}`);
      return null;
    }
  }

  // ─── Listar lojas ─────────────────────────────────────────────────────────
  async getStores() {
    try {
      const data = await this.call('get', '/stores/get');
      return data?.data || data || [];
    } catch (err) {
      this.logger.warn(`Batch getStores error: ${err.message}`);
      return [];
    }
  }
}
