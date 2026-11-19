import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { EbooksService } from './ebooks.service';
import { R2StorageService } from './r2-storage.service';

@Module({
  imports:   [PrismaModule, MailModule],
  providers: [EbooksService, R2StorageService],
  exports:   [EbooksService],
})
export class EbooksModule {}
