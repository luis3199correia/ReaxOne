import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { BatchModule } from '../batch/batch.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { SettingsModule } from '../settings/settings.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { IfthenpayClient } from '../payments/ifthenpay.client';
import { OnlinePaymentService } from './online-payment.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports:     [PrismaModule, BatchModule, MailModule, SettingsModule, DiscountsModule, PromotionsModule],
  providers:   [OrdersService, OnlinePaymentService, IfthenpayClient],
  controllers: [OrdersController, PaymentsController],
  exports:     [OrdersService],
})
export class OrdersModule {}
