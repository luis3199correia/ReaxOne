import { BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

function makePrisma() {
  const prisma = {
    product: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn((args) => args),
      create: jest.fn((args) => args),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  return prisma;
}

function makeService(prisma = makePrisma()) {
  return { service: new ProductsService(prisma as unknown as PrismaService), prisma };
}

describe('ProductsService — ordem dos destaques', () => {
  it('ordena os destaques por featuredOrder e depois pelos mais recentes', async () => {
    const { service, prisma } = makeService();

    await service.findAll(true, true);

    expect(prisma.product.findMany.mock.calls[0][0].orderBy).toEqual([
      { featuredOrder: 'asc' },
      { createdAt: 'desc' },
    ]);
  });

  it('mantém a ordem por data quando não filtra destaques', async () => {
    const { service, prisma } = makeService();

    await service.findAll(false);

    expect(prisma.product.findMany.mock.calls[0][0].orderBy).toEqual({ createdAt: 'desc' });
  });

  it('grava a posição de cada id como featuredOrder numa transação', async () => {
    const { service, prisma } = makeService();
    prisma.product.count.mockResolvedValue(3);

    await service.reorderFeatured(['c', 'a', 'b']);

    expect(prisma.product.update.mock.calls.map(([args]) => [args.where.id, args.data.featuredOrder])).toEqual([
      ['c', 0],
      ['a', 1],
      ['b', 2],
    ]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('rejeita ids inexistentes ou que não estão em destaque', async () => {
    const { service, prisma } = makeService();
    prisma.product.count.mockResolvedValue(1);

    await expect(service.reorderFeatured(['a', 'x'])).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('coloca um produto que passa a destaque no fim da lista', async () => {
    const { service, prisma } = makeService();
    prisma.product.findUnique.mockResolvedValue({ featured: false });
    prisma.product.aggregate.mockResolvedValue({ _max: { featuredOrder: 4 } });

    await service.update('p1', { featured: true });

    expect(prisma.product.update.mock.calls[0][0].data).toEqual({ featured: true, featuredOrder: 5 });
  });

  it('não mexe na posição de um produto que já era destaque', async () => {
    const { service, prisma } = makeService();
    prisma.product.findUnique.mockResolvedValue({ featured: true });

    await service.update('p1', { featured: true, name: 'X' });

    expect(prisma.product.aggregate).not.toHaveBeenCalled();
    expect(prisma.product.update.mock.calls[0][0].data).toEqual({ featured: true, name: 'X' });
  });

  it('primeiro destaque fica na posição 0', async () => {
    const { service, prisma } = makeService();
    prisma.product.aggregate.mockResolvedValue({ _max: { featuredOrder: null } });

    await service.create({ name: 'N', slug: 'n', price: 1, featured: true });

    expect(prisma.product.create.mock.calls[0][0].data.featuredOrder).toBe(0);
  });
});
