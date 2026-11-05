import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { BatchModule } from '../batch/batch.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { SettingsModule } from '../settings/settings.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { PromotionsModule } from '../promotions/promotions.module';

@Module({
  imports:     [PrismaModule, BatchModule, MailModule, SettingsModule, DiscountsModule, PromotionsModule],
  providers:   [OrdersService],
  controllers: [OrdersController],
  exports:     [OrdersService],
})
export class OrdersModule {}
