import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PromotionInput, PromotionsService } from './promotions.service';

@Controller('promotions')
export class PromotionsController {
  constructor(private promotionsService: PromotionsService) {}

  // Público — promoção em vigor agora (carrinho e checkout); null se não houver
  @Get('current')
  current() {
    return this.promotionsService.findCurrentPublic();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll() {
    return this.promotionsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() body: PromotionInput) {
    return this.promotionsService.create(body ?? {});
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: string, @Body() body: PromotionInput) {
    return this.promotionsService.update(id, body ?? {});
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
