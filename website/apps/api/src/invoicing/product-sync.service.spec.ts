import { BadRequestException, ConflictException } from '@nestjs/common';
import { FacturalusaError } from './facturalusa.client';
import { ProductSyncService } from './product-sync.service';

interface FakeProduct {
  id: string;
  slug: string;
  name: string;
  facturalusaItemId: number | null;
  price?: number;
  category?: { facturalusaCategoryId: number | null } | null;
}

function setup(products: FakeProduct[], opts: { configured?: boolean; priceTableId?: number | null } = {}) {
  const client = {
    isConfigured: opts.configured ?? true,
    findItemByReference: jest.fn().mockResolvedValue(null),
    createItem: jest.fn().mockResolvedValue(500),
    updateItem: jest.fn().mockResolvedValue(undefined),
  };
  const prisma = {
    product: {
      findMany: jest.fn().mockResolvedValue(products),
      update: jest.fn().mockResolvedValue(undefined),
    },
  };
  const settings = { getPriceTableId: jest.fn().mockResolvedValue(opts.priceTableId ?? null) };
  const service = new ProductSyncService(prisma as any, client as any, settings as any);
  return { service, client, prisma };
}

const linked: FakeProduct = { id: 'p1', slug: 't-shirt', name: 'T-shirt', facturalusaItemId: 10 };
const unlinked: FakeProduct = { id: 'p2', slug: 'bone', name: 'Boné', facturalusaItemId: null };

describe('ProductSyncService.syncProducts', () => {
  it('recusa quando a API key não está configurada', async () => {
    const { service } = setup([linked], { configured: false });
    await expect(service.syncProducts()).rejects.toBeInstanceOf(BadRequestException);
  });

  it('atualiza o artigo dos produtos que já têm ID guardado', async () => {
    const { service, client } = setup([linked]);

    const result = await service.syncProducts();

    expect(client.updateItem).toHaveBeenCalledWith(10, expect.objectContaining({ reference: 't-shirt', description: 'T-shirt' }));
    expect(client.findItemByReference).not.toHaveBeenCalled();
    expect(result).toEqual({ total: 1, created: 0, updated: 1, failed: [], stoppedReason: null });
  });

  it('envia a categoria do Facturalusa associada à categoria da loja', async () => {
    const { service, client } = setup([{ ...linked, category: { facturalusaCategoryId: 86995 } }]);

    await service.syncProducts();

    expect(client.updateItem).toHaveBeenCalledWith(10, expect.objectContaining({ category: 86995 }));
  });

  it('envia o preço para a tabela de preços configurada', async () => {
    const { service, client } = setup([{ ...linked, price: 24.6 }], { priceTableId: 64520 });

    await service.syncProducts();

    expect(client.updateItem).toHaveBeenCalledWith(10, expect.objectContaining({
      prices: [{ id: '64520', price: 24.6, discount: 0 }],
      cost_price: 20,
    }));
  });

  it('cria o artigo quando não existe e guarda o ID', async () => {
    const { service, client, prisma } = setup([unlinked]);

    const result = await service.syncProducts();

    expect(client.findItemByReference).toHaveBeenCalledWith('bone');
    expect(client.createItem).toHaveBeenCalled();
    expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p2' }, data: { facturalusaItemId: 500 } });
    expect(result.created).toBe(1);
  });

  it('liga e atualiza um artigo que já existe no Facturalusa com a mesma referência', async () => {
    const { service, client, prisma } = setup([unlinked]);
    client.findItemByReference.mockResolvedValue(77);

    const result = await service.syncProducts();

    expect(client.createItem).not.toHaveBeenCalled();
    expect(client.updateItem).toHaveBeenCalledWith(77, expect.any(Object));
    expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p2' }, data: { facturalusaItemId: 77 } });
    expect(result.updated).toBe(1);
  });

  it('volta a ligar pela referência quando o ID guardado já não existe', async () => {
    const { service, client, prisma } = setup([linked]);
    client.updateItem.mockRejectedValueOnce(new FacturalusaError('O artigo não foi encontrado', 404));

    const result = await service.syncProducts();

    expect(client.findItemByReference).toHaveBeenCalledWith('t-shirt');
    expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { facturalusaItemId: 500 } });
    expect(result.created).toBe(1);
  });

  it('volta a ligar pela referência quando o Facturalusa diz que o id é inválido', async () => {
    const { service, client, prisma } = setup([linked]);
    client.updateItem.mockRejectedValueOnce(new FacturalusaError('O valor seleccionado para o campo id é inválido.', 422));

    const result = await service.syncProducts();

    expect(client.findItemByReference).toHaveBeenCalledWith('t-shirt');
    expect(prisma.product.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { facturalusaItemId: 500 } });
    expect(result.created).toBe(1);
  });

  it('quando a referência aponta para o mesmo id que falhou, indica que o problema é a atualização', async () => {
    const { service, client } = setup([linked]);
    client.updateItem.mockRejectedValue(new FacturalusaError('O valor seleccionado para o campo id é inválido.', 422));
    client.findItemByReference.mockResolvedValue(10);

    const result = await service.syncProducts();

    expect(client.createItem).not.toHaveBeenCalled();
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].error).toMatch(/artigo 10 existe.*não aceitou a atualização/i);
  });

  it('regista o erro de um produto e continua com os seguintes', async () => {
    const { service, client } = setup([linked, unlinked]);
    client.updateItem.mockRejectedValueOnce(new FacturalusaError('Descrição bloqueada', 422));

    const result = await service.syncProducts();

    expect(result.failed).toEqual([{ slug: 't-shirt', name: 'T-shirt', error: 'Descrição bloqueada' }]);
    expect(result.created).toBe(1);
  });

  it('recusa uma segunda sincronização enquanto a primeira está a correr', async () => {
    const { service, client } = setup([linked]);
    let release: () => void = () => undefined;
    client.updateItem.mockReturnValueOnce(new Promise<void>((resolve) => { release = resolve; }));

    const first = service.syncProducts();
    await expect(service.syncProducts()).rejects.toBeInstanceOf(ConflictException);
    release();
    await first;

    await expect(service.syncProducts()).resolves.toMatchObject({ updated: 1 });
  });

  it('não sincroniza produtos cuja referência (slug cortado) colide com a de outro', async () => {
    const prefix = 'x'.repeat(60);
    const a: FakeProduct = { id: 'a', slug: `${prefix}-azul`, name: 'A', facturalusaItemId: null };
    const b: FakeProduct = { id: 'b', slug: `${prefix}-verde`, name: 'B', facturalusaItemId: null };
    const { service, client } = setup([a, b, unlinked]);

    const result = await service.syncProducts();

    expect(client.findItemByReference).toHaveBeenCalledTimes(1);
    expect(result.failed.map((f) => f.slug)).toEqual([a.slug, b.slug]);
    expect(result.created).toBe(1);
  });

  it('para quando o limite diário de pedidos é atingido', async () => {
    const { service, client } = setup([linked, unlinked]);
    client.updateItem.mockRejectedValueOnce(new FacturalusaError('Limite diário atingido', 429));

    const result = await service.syncProducts();

    expect(client.findItemByReference).not.toHaveBeenCalled();
    expect(result.stoppedReason).toBe('Limite diário atingido');
    expect(result.updated + result.created).toBe(0);
  });
});
