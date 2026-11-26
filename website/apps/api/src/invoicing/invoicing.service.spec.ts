import { InvoicingService, toInvoiceOrder } from './invoicing.service';
import { FacturalusaError } from './facturalusa.client';

function orderWith(product: Record<string, unknown> | null) {
  return {
    id: 'o1', totalAmount: 10, email: 'a@b.pt', firstName: 'A', lastName: 'B', street: 'R', city: 'C',
    postalCode: '1000-001', country: 'PT', wantsInvoice: false, nif: null, companyName: null,
    shippingCost: 0, discountAmount: 0,
    items: [{ productId: 'p1', name: 'X', price: 10, quantity: 1, size: null, isGift: false, product }],
  };
}

describe('toInvoiceOrder', () => {
  it('marca como ebook a linha de um produto com ficheiro de ebook', () => {
    expect(toInvoiceOrder(orderWith({ ebookFile: 'ebooks/guia.pdf', category: null })).items[0].isEbook).toBe(true);
  });

  it('marca como ebook a linha de um produto da categoria Ebooks', () => {
    expect(toInvoiceOrder(orderWith({ category: { slug: 'ebooks' } })).items[0].isEbook).toBe(true);
  });

  it('não marca como ebook os restantes produtos', () => {
    expect(toInvoiceOrder(orderWith({ ebookFile: null, category: { slug: 'roupa' } })).items[0].isEbook).toBe(false);
    expect(toInvoiceOrder(orderWith(null)).items[0].isEbook).toBe(false);
  });
});

describe('InvoicingService — IDs inválidos no Facturalusa', () => {
  const customerError = new FacturalusaError('É obrigatória a indicação de um valor para o campo customer_id.', 400);
  const itemError = new FacturalusaError('É obrigatória a indicação de um valor para o campo item id', 400);
  const sale = { id: 1, number: 1, document_full_number: 'FR 1', url_file: null, grand_total: 10, status: 'Terminado' };
  const product = { id: 'p1', slug: 'p', name: 'P', price: 10, facturalusaItemId: 5, category: null };

  function setup(nif: string | null = null) {
    const client = { createSale: jest.fn() };
    const ids = {
      customerFor: jest.fn().mockResolvedValueOnce(11).mockResolvedValue(22),
      forgetGenericCustomer: jest.fn(),
      articlesFor: jest.fn().mockResolvedValue({ p1: 5 }),
      shippingArticle: jest.fn(),
      forgetItemIds: jest.fn(),
    };
    const service = new InvoicingService({} as any, client as any, ids as any, {} as any);
    const order = toInvoiceOrder({ ...orderWith(null), wantsInvoice: !!nif, nif });
    const run = () => (service as any).createSaleWithRecovery(order, [product], { series: '', draft: false });
    return { client, ids, run };
  }

  it('esquece o cliente genérico guardado e tenta de novo com o novo ID', async () => {
    const { client, ids, run } = setup();
    client.createSale.mockRejectedValueOnce(customerError).mockResolvedValueOnce(sale);

    await expect(run()).resolves.toBe(sale);

    expect(ids.forgetGenericCustomer).toHaveBeenCalledTimes(1);
    expect(client.createSale.mock.calls.map(([p]) => p.customer)).toEqual([11, 22]);
  });

  it('só tenta uma vez: se o cliente continuar inválido, devolve o erro', async () => {
    const { client, ids, run } = setup();
    client.createSale.mockRejectedValue(customerError);

    await expect(run()).rejects.toBe(customerError);
    expect(ids.forgetGenericCustomer).toHaveBeenCalledTimes(1);
    expect(client.createSale).toHaveBeenCalledTimes(2);
  });

  it('com NIF não mexe no cliente genérico', async () => {
    const { client, ids, run } = setup('123456789');
    client.createSale.mockRejectedValue(customerError);

    await expect(run()).rejects.toBe(customerError);
    expect(ids.forgetGenericCustomer).not.toHaveBeenCalled();
  });

  it('recupera cliente e artigos na mesma emissão', async () => {
    const { client, ids, run } = setup();
    client.createSale.mockRejectedValueOnce(customerError).mockRejectedValueOnce(itemError).mockResolvedValueOnce(sale);

    await expect(run()).resolves.toBe(sale);
    expect(ids.forgetItemIds).toHaveBeenCalledWith(['p1']);
    expect(ids.articlesFor.mock.calls[2][0][0].facturalusaItemId).toBeNull();
  });
});
