import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { DiscountInput, DiscountsService } from './discounts.service';

@Controller('discounts')
export class DiscountsController {
  constructor(private discountsService: DiscountsService) {}

  // Público — o checkout pré-visualiza o desconto (rate limit estrito, ver throttle.config.ts)
  @Post('validate')
  validate(@Body() body: { code?: string; subtotal?: number }) {
    return this.discountsService.preview(body?.code, body?.subtotal);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll() {
    return this.discountsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() body: DiscountInput) {
    return this.discountsService.create(body ?? {});
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: string, @Body() body: DiscountInput) {
    return this.discountsService.update(id, body ?? {});
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.discountsService.remove(id);
  }
}
