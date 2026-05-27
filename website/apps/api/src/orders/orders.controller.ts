import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // Criar encomenda (pode ser guest ou autenticado)
  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.ordersService.create({
      ...body,
      userId: req.user?.id,
    });
  }

  // Encomendas do cliente autenticado
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req: any) {
    return this.ordersService.findByUser(req.user.id);
  }

  // Admin: todas as encomendas
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll() {
    return this.ordersService.findAll();
  }

  // Admin: detalhes de uma encomenda
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  // Admin: atualizar estado da encomenda
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateStatus(id, status);
  }

  // Admin: confirmar pagamento
  @Patch(':id/confirm-payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  confirmPayment(@Param('id') id: string) {
    return this.ordersService.confirmPayment(id);
  }
}
