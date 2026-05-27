import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // Público: dados de pagamento para o cliente (após encomenda)
  @Get('details')
  getDetails(@Query('method') method: 'MBWAY' | 'BANK_TRANSFER') {
    return this.paymentsService.getPaymentDetails(method);
  }

  // Admin: guardar configurações de pagamento
  @Post('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateSettings(@Body() body: Record<string, string>) {
    return this.paymentsService.updateSettings(body);
  }
}
