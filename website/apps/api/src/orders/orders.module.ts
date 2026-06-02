import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { BatchModule } from '../batch/batch.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports:     [PrismaModule, BatchModule],
  providers:   [OrdersService],
  controllers: [OrdersController],
  exports:     [OrdersService],
})
export class OrdersModule {}
