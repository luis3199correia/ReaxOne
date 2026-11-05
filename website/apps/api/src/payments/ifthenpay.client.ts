import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import { formatAmount, IfthenpayConfig, parseIfthenpayDate, readIfthenpayConfig } from './ifthenpay.rules';

const API = 'https://api.ifthenpay.com';
const REQUEST_TIMEOUT_MS = 15_000;
const UNAVAILABLE = 'O pagamento está temporariamente indisponível. Tenta novamente ou escolhe outro método.';

export interface MultibancoReference {
  entity: string;
  reference: string;
  requestId: string;
  expiresAt: Date | null;
}

/**
 * Cliente HTTP da IfthenPay (API REST). Endpoints e campos seguem o SDK oficial:
 * MB WAY e Multibanco diretos; cartão e Apple Pay pela página do Gateway (Pay by Link).
 */
@Injectable()
export class IfthenpayClient {
  private readonly logger = new Logger(IfthenpayClient.name);

  get config(): IfthenpayConfig {
    return readIfthenpayConfig();
  }

  /** Envia o pedido de pagamento para a app MB WAY do cliente. */
  async requestMbway(input: { orderRef: string; amount: number; phone: string; email: string; description: string }) {
    const data = await this.post(`${API}/spg/payment/mbway`, {
      mbWayKey:     this.config.mbwayKey,
      orderId:      input.orderRef,
      amount:       formatAmount(input.amount),
      mobileNumber: input.phone,
      email:        input.email,
      description:  input.description.slice(0, 70),
    });
    const status = String(data?.Status ?? '');
    if (status === '999') {
      throw new BadRequestException('Este número não tem MB WAY ativo. Confirma o número ou escolhe outro método.');
    }
    if (status !== '000' || !data?.RequestId) {
      this.logger.warn(`MB WAY recusado (Status ${status}): ${data?.Message ?? ''}`);
      throw new BadRequestException('Não foi possível enviar o pedido MB WAY. Confirma o número ou escolhe outro método.');
    }
    return { requestId: String(data.RequestId) };
  }

  /** Gera uma referência Multibanco (entidade + referência) para a encomenda. */
  async createMultibancoReference(input: { orderRef: string; amount: number; description: string; email: string; name: string }): Promise<MultibancoReference> {
    const data = await this.post(`${API}/multibanco/reference/init`, {
      mbKey:       this.config.mbKey,
      orderId:     input.orderRef,
      amount:      formatAmount(input.amount),
      description: input.description.slice(0, 200),
      expiryDays:  this.config.mbExpiryDays,
      clientEmail: input.email,
      clientName:  input.name,
    });
    if (String(data?.Status ?? '') !== '0' || !data?.Entity || !data?.Reference) {
      this.logger.warn(`Multibanco recusado: ${data?.Message ?? ''}`);
      throw new ServiceUnavailableException(UNAVAILABLE);
    }
    return {
      entity:    String(data.Entity),
      reference: String(data.Reference),
      requestId: String(data.RequestId ?? ''),
      expiresAt: parseIfthenpayDate(data.ExpiryDate),
    };
  }

  /** Cria a sessão na página de pagamento da IfthenPay (só com a conta pedida: cartão ou Apple Pay). */
  async createGatewaySession(input: {
    orderRef: string;
    amount: number;
    description: string;
    account: string;
    lang: 'pt' | 'en';
    returnUrl: (result: 'success' | 'error' | 'cancel') => string;
  }): Promise<{ redirectUrl: string }> {
    const data = await this.post(`${API}/gateway/pinpay/${encodeURIComponent(this.config.gatewayKey)}`, {
      id:          input.orderRef,
      amount:      formatAmount(input.amount),
      description: input.description.slice(0, 200),
      accounts:    input.account,
      success_url: input.returnUrl('success'),
      error_url:   input.returnUrl('error'),
      cancel_url:  input.returnUrl('cancel'),
      lang:        input.lang,
    });
    const redirectUrl = String(data?.RedirectUrl ?? data?.redirect_url ?? '');
    if (!/^https:\/\//.test(redirectUrl)) {
      this.logger.warn(`Gateway recusado: ${data?.Message ?? ''}`);
      throw new ServiceUnavailableException(UNAVAILABLE);
    }
    return { redirectUrl };
  }

  private async post(url: string, body: Record<string, unknown>) {
    try {
      const res = await axios.post(url, body, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
      });
      return res.data;
    } catch (e: any) {
      // Não registar o URL completo: o do Gateway leva a chave
      this.logger.error(`Erro na API IfthenPay (${e?.response?.status ?? e?.code ?? 'sem resposta'})`);
      throw new ServiceUnavailableException(UNAVAILABLE);
    }
  }
}
