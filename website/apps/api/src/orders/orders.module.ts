import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { BatchModule } from '../batch/batch.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports:     [PrismaModule, BatchModule, MailModule, SettingsModule],
  providers:   [OrdersService],
  controllers: [OrdersController],
  exports:     [OrdersService],
})
export class OrdersModule {}
