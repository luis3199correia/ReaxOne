import { BadRequestException } from '@nestjs/common';
import { InvoicingSettingsService } from './invoicing-settings.service';

function setup(rows: Array<{ key: string; value: string }> = []) {
  const prisma = {
    settings: {
      findMany: jest.fn().mockResolvedValue(rows),
      findUnique: jest.fn(({ where }) => Promise.resolve(rows.find((r) => r.key === where.key) ?? null)),
      upsert: jest.fn().mockResolvedValue(undefined),
      deleteMany: jest.fn().mockResolvedValue(undefined),
    },
  };
  return { service: new InvoicingSettingsService(prisma as any), prisma };
}

describe('InvoicingSettingsService — tabela de preços', () => {
  it('lê o ID da tabela de preços guardado', async () => {
    const { service } = setup([{ key: 'facturalusa_price_table_id', value: '64520' }]);
    expect(await service.getPriceTableId()).toBe(64520);
    expect((await service.get()).priceTableId).toBe(64520);
  });

  it('sem valor guardado devolve null', async () => {
    const { service } = setup();
    expect(await service.getPriceTableId()).toBeNull();
  });

  it('grava um ID válido e limpa com vazio', async () => {
    const { service, prisma } = setup();
    await service.update({ priceTableId: '64520' });
    expect(prisma.settings.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { value: '64520' } }));
    await service.update({ priceTableId: '' });
    expect(prisma.settings.deleteMany).toHaveBeenCalledWith({ where: { key: 'facturalusa_price_table_id' } });
  });

  it('recusa um ID inválido', async () => {
    const { service } = setup();
    await expect(service.update({ priceTableId: 'abc' })).rejects.toBeInstanceOf(BadRequestException);
  });
});
