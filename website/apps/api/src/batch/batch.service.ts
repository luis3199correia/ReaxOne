import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';

const BASE_URL = 'https://mybatch.itsabatch.com/api/dispatch';
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const MESSAGE_MAX = 300;
const AVAILABILITY_CACHE_MS = 10 * 60_000;
const AVAILABILITY_CACHE_MAX = 500;
/** Prefixo dos códigos de pontos de recolha (BL-12-<ponto>). */
const PICKUP_POINT_CODE = /^BL-\d+-.+$/;

export interface BatchAvailabilityOption {
  serviceCode: string;   // ex.: BL-14 (domicílio) ou BL-12-8810769 (ponto de recolha)
  serviceName: string;   // descrição mostrada ao cliente
  priceBase: number;     // sem IVA
  isPickupPoint: boolean;
}

/** Métodos válidos da resposta do /availability (preço vem como texto, ex.: "3.61"). */
export function parseAvailability(methods: unknown): BatchAvailabilityOption[] {
  if (!Array.isArray(methods)) return [];
  return methods.flatMap((m: any) => {
    const serviceCode = typeof m?.service_code === 'string' ? m.service_code.trim() : '';
    const serviceName = typeof m?.service_name === 'string' ? m.service_name.trim() : '';
    const priceBase = Number(m?.price);
    if (!serviceCode || !serviceName || !Number.isFinite(priceBase) || priceBase < 0) return [];
    return [{ serviceCode, serviceName, priceBase, isPickupPoint: PICKUP_POINT_CODE.test(serviceCode) }];
  });
}

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
      store:    process.env.BATCH_STORE_ID?.trim() || '',
      platform: process.env.BATCH_PLATFORM || '3',
    };
  }

  private storePromise: Promise<string | null> | null = null;

  /**
   * Loja da Batch para os envios: BATCH_STORE_ID, ou a primeira loja da conta
   * (a conta ReaxOne tem uma só). Antes o valor por omissão era "1", uma loja que não é nossa.
   */
  private storeId(): Promise<string | null> {
    if (this.credentials.store) return Promise.resolve(this.credentials.store);
    if (!this.storePromise) {
      this.storePromise = this.call('get', '/stores/get')
        .then((data) => {
          const id = Array.isArray(data?.stores) ? data.stores[0]?.id : undefined;
          return id !== undefined && id !== null ? String(id) : null;
        })
        .catch((err) => {
          this.storePromise = null;
          this.logger.warn(`Batch: não foi possível obter a loja (${err.message})`);
          return null;
        });
    }
    return this.storePromise;
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

  // ─── Opções de envio (dispatch/availability), com cache curta ─────────────
  private readonly availabilityCache = new Map<string, { at: number; options: BatchAvailabilityOption[] }>();

  /**
   * Métodos de envio e preços (sem IVA) da Batch para um destino. Lança erro se a
   * Batch falhar — sem preço fiável não se vende com portes inventados.
   */
  async getAvailability(countryCode: string, zipcode: string): Promise<BatchAvailabilityOption[]> {
    const country = countryCode.trim().toUpperCase();
    const zip = zipcode.trim();
    const key = `${country}|${zip.replace(/\s+/g, '').toUpperCase()}`;
    const cached = this.availabilityCache.get(key);
    if (cached && Date.now() - cached.at < AVAILABILITY_CACHE_MS) return cached.options;

    const data = await this.call('post', '/availability', { country_code: country, zipcode: zip });
    const options = data?.available === false ? [] : parseAvailability(data?.methods);

    if (this.availabilityCache.size >= AVAILABILITY_CACHE_MAX) this.availabilityCache.clear();
    this.availabilityCache.set(key, { at: Date.now(), options });
    return options;
  }

  /** Admin/debug: resposta em bruto de um POST à API da Batch. */
  async postRaw(path: string, fields: Record<string, string>): Promise<any> {
    return this.call('post', path, fields);
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
      const store = await this.storeId();
      if (store) fields.store = store;
      // cart: objeto JSON em texto, { "Nome // SKU": quantidade } (documentação da Batch)
      fields.cart = JSON.stringify(payload.cart);

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
