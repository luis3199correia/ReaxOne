import {
  Controller, Post, Get, Body, Param, UseGuards, HttpCode, BadRequestException, ServiceUnavailableException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { BatchService } from './batch.service';
import { detectZone, priceWithVat } from '../orders/shipping-rates';

const ZIPCODE_MAX = 12;

@Controller('shipping')
export class BatchController {
  constructor(private batchService: BatchService) {}

  // Público — opções de envio do checkout (dispatch/availability da Batch), preços com IVA.
  // Os portes grátis aplicam-se no checkout e são recalculados ao criar a encomenda.
  @Post('options')
  @HttpCode(200)
  async getOptions(@Body() body: { country?: unknown; zipcode?: unknown }) {
    const country = typeof body?.country === 'string' ? body.country.trim().toUpperCase() : '';
    const zipcode = typeof body?.zipcode === 'string' ? body.zipcode.trim() : '';
    if (!/^[A-Z]{2}$/.test(country) || !zipcode || zipcode.length > ZIPCODE_MAX) {
      throw new BadRequestException('Indica o país e o código postal.');
    }
    if (detectZone(country, zipcode) === 'BLOCKED') return { options: [] };

    try {
      const options = await this.batchService.getAvailability(country, zipcode);
      return {
        options: options.map((o) => ({
          id:            o.serviceCode,
          name:          o.serviceName,
          price:         priceWithVat(o.priceBase),
          isPickupPoint: o.isPickupPoint,
        })),
      };
    } catch {
      throw new ServiceUnavailableException('Não foi possível obter as opções de envio. Tenta novamente.');
    }
  }

  // Debug — resposta em bruto do zipcode/methods (admin apenas)
  @Post('methods/raw')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getMethodsRaw(@Body() body: { zipcode: string }) {
    return this.batchService.postRaw('/zipcode/methods', { zipcode: body.zipcode ?? '' });
  }

  // Admin — listar lojas Batch
  @Get('stores')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getStores() {
    return this.batchService.getStores();
  }

  // Admin — estado de uma encomenda Batch
  @Post('order/:batchNumber/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getStatus(@Param('batchNumber') batchNumber: string) {
    return this.batchService.getOrderStatus(batchNumber);
  }

  // Admin — tracking de uma encomenda Batch
  @Post('order/:batchNumber/tracking')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getTracking(@Param('batchNumber') batchNumber: string) {
    return this.batchService.getOrderTracking(batchNumber);
  }
}
