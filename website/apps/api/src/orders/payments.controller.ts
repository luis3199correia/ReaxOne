import { Controller, ForbiddenException, Get, HttpCode, Logger, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SettingsService } from '../settings/settings.service';
import { paymentAvailability } from '../payments/payment-availability';
import { OrdersService } from './orders.service';
import { OnlinePaymentService } from './online-payment.service';
import { IfthenpayClient } from '../payments/ifthenpay.client';
import { GATEWAY_METHODS, OnlineMethod, enabledOnlineMethods, isValidAntiPhishingKey } from '../payments/ifthenpay.rules';

/**
 * Pagamentos IfthenPay.
 *
 * URLs de callback a registar na IfthenPay (os [MARCADORES] são substituídos por eles):
 *   MB WAY:      {API}/api/payments/ifthenpay/mbway?key=[ANTI_PHISHING_KEY]&orderId=[ORDER_ID]&amount=[AMOUNT]&requestId=[REQUEST_ID]
 *   Multibanco:  {API}/api/payments/ifthenpay/multibanco?key=[ANTI_PHISHING_KEY]&orderId=[ORDER_ID]&amount=[AMOUNT]&entity=[ENTITY]&reference=[REFERENCE]
 *   Gateway:     {API}/api/payments/ifthenpay/gateway?key=[ANTI_PHISHING_KEY]&orderId=[ID]&amount=[AMOUNT]&method=[PAYMENT_METHOD]&requestId=[REQUEST_ID]
 */
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private ordersService: OrdersService,
    private onlinePayments: OnlinePaymentService,
    private ifthenpay: IfthenpayClient,
    private settingsService: SettingsService,
  ) {}

  /** Métodos que o checkout mostra: ligados no backoffice e, os da IfthenPay, com chaves. */
  @Get('methods')
  async methods() {
    const settings = await this.settingsService.getPublicSettings();
    return paymentAvailability(settings, enabledOnlineMethods(this.ifthenpay.config));
  }

  /** Backoffice: que métodos IfthenPay têm as chaves configuradas na API. */
  @Get('admin/keys')
  @UseGuards(JwtAuthGuard, RolesGuard)
  keys() {
    return enabledOnlineMethods(this.ifthenpay.config);
  }

  /** Estado do pagamento, consultado pela página de confirmação enquanto o cliente paga. */
  @Get(':orderId/status')
  async status(@Param('orderId') orderId: string) {
    const status = await this.onlinePayments.status(orderId);
    if (!status) throw new NotFoundException('Encomenda não encontrada');
    return status;
  }

  @Get('ifthenpay/mbway')
  @HttpCode(200)
  mbwayCallback(@Query() query: Record<string, unknown>) {
    return this.handleCallback(query, ['MBWAY']);
  }

  @Get('ifthenpay/multibanco')
  @HttpCode(200)
  multibancoCallback(@Query() query: Record<string, unknown>) {
    return this.handleCallback(query, ['MULTIBANCO']);
  }

  @Get('ifthenpay/gateway')
  @HttpCode(200)
  async gatewayCallback(@Query() query: Record<string, unknown>) {
    const methods: OnlineMethod[] = [...GATEWAY_METHODS];
    // O Gateway também notifica cancelamentos/erros (com "status"): a encomenda
    // é cancelada logo, para o stock ficar livre se o cliente voltar a tentar.
    if (typeof query.status === 'string' && query.status !== '') {
      const providerRef = this.validatedRef(query, methods);
      await this.onlinePayments.cancelByProviderRef(providerRef, methods);
      return { ok: true };
    }
    return this.handleCallback(query, methods);
  }

  private handleCallback(query: Record<string, unknown>, methods: OnlineMethod[]) {
    const providerRef = this.validatedRef(query, methods);
    return this.ordersService.confirmOnlinePayment({ providerRef, methods, amount: query.amount });
  }

  /** Valida a chave anti-phishing e devolve o orderId enviado à IfthenPay. */
  private validatedRef(query: Record<string, unknown>, methods: OnlineMethod[]): string {
    if (!isValidAntiPhishingKey(query.key, this.ifthenpay.config.antiPhishingKey)) {
      this.logger.warn(`[Pagamentos] Callback ${methods.join('/')} com chave inválida`);
      throw new ForbiddenException('Chave inválida');
    }
    const providerRef = typeof query.orderId === 'string' ? query.orderId : '';
    if (!providerRef) throw new NotFoundException('Pagamento não encontrado');
    return providerRef;
  }
}
