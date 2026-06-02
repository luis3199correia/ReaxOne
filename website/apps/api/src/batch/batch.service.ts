import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';

const BASE_URL = 'https://mybatch.itsabatch.com/api/dispatch';

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
}

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  private get credentials() {
    return {
      email:    process.env.BATCH_EMAIL    || '',
      password: process.env.BATCH_PASSWORD || '',
      store:    process.env.BATCH_STORE_ID || '1',
      platform: process.env.BATCH_PLATFORM || '3',
    };
  }

  private async getToken(): Promise<string> {
    // Reutiliza token se ainda válido (1h de margem)
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    const form = new FormData();
    form.append('email', this.credentials.email);
    form.append('password', this.credentials.password);

    const res = await axios.post(`${BASE_URL}/token/generate`, form, {
      headers: form.getHeaders(),
    });

    // A resposta pode ser { token: '...' } ou { data: { token: '...' } }
    const token = res.data?.token || res.data?.data?.token || res.data;
    if (!token || typeof token !== 'string') {
      throw new Error('Batch: token inválido na resposta');
    }

    this.token = token;
    this.tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000); // 23h
    return this.token;
  }

  private async authHeader() {
    const token = await this.getToken();
    return { 'Api-Auth': `Bearer ${token}` };
  }

  // ─── Métodos de envio para um código postal ───────────────────────────────
  async getShippingMethods(zipcode: string): Promise<BatchShippingMethod[]> {
    try {
      const headers = await this.authHeader();
      const form = new FormData();
      form.append('zipcode', zipcode);

      const res = await axios.post(`${BASE_URL}/zipcode/methods`, form, {
        headers: { ...form.getHeaders(), ...headers },
      });

      // Formato: { error: false, shipping_methods: [{ id, name }] }
      const items: any[] = res.data?.shipping_methods || [];

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
      const headers = await this.authHeader();
      const form = new FormData();

      form.append('phone',       payload.phone);
      form.append('email',       payload.email);
      form.append('clientname',  payload.clientname);
      form.append('address',     payload.address);
      form.append('door',        payload.door || '');
      form.append('floor',       payload.floor || '');
      form.append('zipcode',     payload.zipcode);
      form.append('city',        payload.city);
      form.append('country',     payload.country || 'Portugal');
      form.append('obs',         payload.obs || '');
      form.append('external_id', payload.external_id);
      form.append('platform',    this.credentials.platform);
      form.append('weight',      String(payload.weight));
      form.append('volumes',     String(payload.volumes));
      form.append('total',       String(payload.total));
      form.append('store',       this.credentials.store);
      form.append('status',      'pronta para recolha');

      // cart: { "nome // sku": quantidade }
      for (const [key, qty] of Object.entries(payload.cart)) {
        form.append(`cart[${key}]`, String(qty));
      }

      const res = await axios.post(`${BASE_URL}/order/create`, form, {
        headers: { ...form.getHeaders(), ...headers },
      });

      const orderNumber = res.data?.order_number || res.data?.data?.order_number;
      this.logger.log(`Batch order criada: ${orderNumber}`);
      return orderNumber || null;
    } catch (err) {
      this.logger.error(`Batch createOrder error: ${err.message}`);
      return null;
    }
  }

  // ─── Estado da encomenda ──────────────────────────────────────────────────
  async getOrderStatus(orderNumber: string) {
    try {
      const headers = await this.authHeader();
      const form = new FormData();
      form.append('order_number', orderNumber);

      const res = await axios.post(`${BASE_URL}/order/status`, form, {
        headers: { ...form.getHeaders(), ...headers },
      });
      return res.data?.data || res.data;
    } catch (err) {
      this.logger.warn(`Batch getOrderStatus error: ${err.message}`);
      return null;
    }
  }

  // ─── Tracking da encomenda ────────────────────────────────────────────────
  async getOrderTracking(orderNumber: string) {
    try {
      const headers = await this.authHeader();
      const form = new FormData();
      form.append('order_number', orderNumber);

      const res = await axios.post(`${BASE_URL}/order/tracking`, form, {
        headers: { ...form.getHeaders(), ...headers },
      });
      return res.data?.data || res.data;
    } catch (err) {
      this.logger.warn(`Batch getOrderTracking error: ${err.message}`);
      return null;
    }
  }

  // ─── Mudar estado ─────────────────────────────────────────────────────────
  async changeOrderStatus(orderNumber: string, status: string) {
    try {
      const headers = await this.authHeader();
      const form = new FormData();
      form.append('order_number', orderNumber);
      form.append('status', status);

      const res = await axios.post(`${BASE_URL}/order/status/change`, form, {
        headers: { ...form.getHeaders(), ...headers },
      });
      return res.data;
    } catch (err) {
      this.logger.warn(`Batch changeOrderStatus error: ${err.message}`);
      return null;
    }
  }

  // ─── Listar lojas ─────────────────────────────────────────────────────────
  async getStores() {
    try {
      const headers = await this.authHeader();
      const res = await axios.get(`${BASE_URL}/stores/get`, { headers });
      return res.data?.data || res.data || [];
    } catch (err) {
      this.logger.warn(`Batch getStores error: ${err.message}`);
      return [];
    }
  }
}
