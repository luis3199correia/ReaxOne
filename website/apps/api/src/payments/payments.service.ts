import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Devolve os dados de pagamento a mostrar ao cliente
   * consoante o método escolhido (lidos das Settings)
   */
  async getPaymentDetails(method: 'MBWAY' | 'BANK_TRANSFER') {
    const settings = await this.prisma.settings.findMany({
      where: {
        key: {
          in:
            method === 'MBWAY'
              ? ['mbway_phone']
              : ['bank_iban', 'bank_holder'],
        },
      },
    });

    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return map;
  }

  async updateSettings(data: Record<string, string>) {
    const ops = Object.entries(data).map(([key, value]) =>
      this.prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );
    return Promise.all(ops);
  }
}
