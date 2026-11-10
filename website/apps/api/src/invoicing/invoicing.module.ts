import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FacturalusaClient } from './facturalusa.client';
import { FacturalusaIdsService } from './facturalusa-ids.service';
import { InvoicingController } from './invoicing.controller';
import { InvoicingService } from './invoicing.service';
import { InvoicingSettingsService } from './invoicing-settings.service';

@Module({
  imports:     [PrismaModule],
  providers:   [FacturalusaClient, FacturalusaIdsService, InvoicingService, InvoicingSettingsService],
  controllers: [InvoicingController],
  exports:     [InvoicingService],
})
export class InvoicingModule {}
