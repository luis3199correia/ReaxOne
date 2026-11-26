import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { BatchService } from './batch.service';

@Controller('shipping')
export class BatchController {
  constructor(private batchService: BatchService) {}

  // Público — usado no checkout para mostrar métodos de envio
  @Post('methods')
  async getMethods(@Body() body: { zipcode: string }) {
    if (!body.zipcode) return { methods: [] };
    const methods = await this.batchService.getShippingMethods(body.zipcode);
    return { methods };
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
