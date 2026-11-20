import { toInvoiceOrder } from './invoicing.service';

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
