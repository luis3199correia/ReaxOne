import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
  @UseGuards(JwtAuthGuard)
  async getMethodsRaw(@Body() body: { zipcode: string }) {
    const headers = await (this as any).batchService.authHeader();
    const FormData = require('form-data');
    const axios = require('axios');
    const form = new FormData();
    form.append('zipcode', body.zipcode);
    const res = await axios.post('https://mybatch.itsabatch.com/api/dispatch/zipcode/methods', form, {
      headers: { ...form.getHeaders(), ...headers },
    });
    return res.data;
  }

  // Admin — listar lojas Batch
  @Get('stores')
  @UseGuards(JwtAuthGuard)
  getStores() {
    return this.batchService.getStores();
  }

  // Admin — estado de uma encomenda Batch
  @Post('order/:batchNumber/status')
  @UseGuards(JwtAuthGuard)
  getStatus(@Param('batchNumber') batchNumber: string) {
    return this.batchService.getOrderStatus(batchNumber);
  }

  // Admin — tracking de uma encomenda Batch
  @Post('order/:batchNumber/tracking')
  @UseGuards(JwtAuthGuard)
  getTracking(@Param('batchNumber') batchNumber: string) {
    return this.batchService.getOrderTracking(batchNumber);
  }
}
