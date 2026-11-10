import {
  GENERIC_VAT_NUMBER,
  InvoiceOrder,
  buildCustomerPayload,
  buildSalePayload,
  discountPercent,
  expectedSaleTotal,
  externalReference,
  invoiceBlocker,
  lisbonDate,
  selectCustomer,
  totalsMatch,
} from './invoice-rules';

const IDS = { customerId: 77, articleIds: { p1: 101, p2: 102 }, shippingArticleId: 900 };

function makeOrder(overrides: Partial<InvoiceOrder> = {}): InvoiceOrder {
  return {
    id: 'ckorder123',
    totalAmount: 29.98,
    email: 'ana@example.com',
    firstName: 'Ana',
    lastName: 'Silva',
    street: 'Rua A, 1',
    city: 'Porto',
    postalCode: '4000-001',
    country: 'PT',
    wantsInvoice: false,
    nif: null,
    companyName: null,
    shippingCost: 0,
    discountAmount: 0,
    items: [{ productId: 'p1', name: 'Bola', price: 14.99, quantity: 2, size: null, isGift: false }],
    ...overrides,
  };
}

function build(order: InvoiceOrder, settings = { draft: true, series: '' }) {
  return buildSalePayload({ order, ...IDS, settings, issueDate: '2026-11-10' });
}

describe('selectCustomer', () => {
  it('usa o consumidor final quando não há NIF', () => {
    expect(selectCustomer(makeOrder())).toEqual({ kind: 'generic' });
  });

  it('usa o consumidor final quando há NIF mas o cliente não pediu fatura', () => {
    expect(selectCustomer(makeOrder({ nif: '123456789', wantsInvoice: false }))).toEqual({ kind: 'generic' });
  });

  it('usa o consumidor final quando o NIF é o genérico', () => {
    expect(selectCustomer(makeOrder({ wantsInvoice: true, nif: GENERIC_VAT_NUMBER }))).toEqual({ kind: 'generic' });
  });

  it('empresa com NIF: nome da empresa e tipo Empresarial', () => {
    const spec = selectCustomer(makeOrder({ wantsInvoice: true, nif: ' 509 999 999 ', companyName: 'Reax Lda' }));
    expect(spec).toEqual({ kind: 'nif', vatNumber: '509999999', name: 'Reax Lda', type: 'Empresarial' });
  });

  it('particular com NIF: nome completo e tipo Particular', () => {
    const spec = selectCustomer(makeOrder({ wantsInvoice: true, nif: 'PT123456789', companyName: '  ' }));
    expect(spec).toEqual({ kind: 'nif', vatNumber: '123456789', name: 'Ana Silva', type: 'Particular' });
  });
});

describe('buildCustomerPayload', () => {
  it('cria o cliente com IVA incluído e os dados da encomenda', () => {
    const order = makeOrder({ wantsInvoice: true, nif: '509999999', companyName: 'Reax Lda' });
    const payload = buildCustomerPayload(selectCustomer(order) as any, order);
    expect(payload).toMatchObject({
      name: 'Reax Lda', vat_number: '509999999', type: 'Empresarial', vat_type: 'IVA incluído',
      country: 'PT', address: 'Rua A, 1', city: 'Porto', postal_code: '4000-001', email: 'ana@example.com',
    });
  });
});

describe('buildSalePayload', () => {
  it('consumidor sem NIF: Factura Recibo em rascunho, sem NIF nem morada', () => {
    const payload = build(makeOrder());
    expect(payload).toMatchObject({
      issue_date: '2026-11-10',
      document_type: 'Factura Recibo',
      customer: 77,
      vat_type: 'IVA incluído',
      status: 'Rascunho',
      external_reference: 'REAXONE-ckorder123',
    });
    expect(payload.vat_number).toBeUndefined();
    expect(payload.address).toBeUndefined();
    expect(payload.serie).toBeUndefined();
    expect(payload.force_send_email).toBe(false);
    expect(payload.items).toEqual([{ id: 101, price: 14.99, quantity: 2, vat: 23 }]);
  });

  it('empresa com NIF: envia NIF e morada; série quando configurada; Terminado', () => {
    const order = makeOrder({ wantsInvoice: true, nif: '509999999', companyName: 'Reax Lda' });
    const payload = build(order, { draft: false, series: '2026A' });
    expect(payload).toMatchObject({
      vat_number: '509999999', address: 'Rua A, 1', city: 'Porto', postal_code: '4000-001', country: 'PT',
      serie: '2026A', status: 'Terminado',
    });
  });

  it('desconto da encomenda vira a mesma % em cada linha paga e mantém o total', () => {
    const order = makeOrder({
      items: [
        { productId: 'p1', name: 'Bola', price: 9.99, quantity: 3, size: null, isGift: false },
        { productId: 'p2', name: 'Meias', price: 7.5, quantity: 1, size: null, isGift: false },
      ],
      discountAmount: 3.75, // 10% de 37,47 arredondado
      shippingCost: 3.9,
      totalAmount: 37.62,   // 37,47 - 3,75 + 3,90
    });
    const payload = build(order);
    const pct = discountPercent(order);
    expect(pct).toBeCloseTo((3.75 / 37.47) * 100, 6);
    expect(payload.items[0].discount).toBe(pct);
    expect(payload.items[1].discount).toBe(pct);
    expect(Math.abs(expectedSaleTotal(payload) - order.totalAmount)).toBeLessThanOrEqual(0.01);
  });

  it('ofertas vão a preço 0, sem desconto e com "Oferta" nos detalhes', () => {
    const order = makeOrder({
      items: [
        { productId: 'p1', name: 'Bola', price: 14.99, quantity: 2, size: null, isGift: false },
        { productId: 'p2', name: 'Meias', price: 0, quantity: 1, size: 'M', isGift: true },
      ],
      discountAmount: 3,
      totalAmount: 26.98,
    });
    const gift = build(order).items[1];
    expect(gift).toEqual({ id: 102, price: 0, quantity: 1, vat: 23, details: 'Tamanho: M · Oferta' });
  });

  it('portes vão numa linha própria só quando há custo de envio', () => {
    expect(build(makeOrder()).items).toHaveLength(1);
    const payload = build(makeOrder({ shippingCost: 4.5, totalAmount: 34.48 }));
    expect(payload.items[1]).toEqual({ id: 900, price: 4.5, quantity: 1, vat: 23 });
  });

  it('o tamanho aparece nos detalhes da linha', () => {
    const order = makeOrder({ items: [{ productId: 'p1', name: 'Meias', price: 5, quantity: 1, size: '39-42', isGift: false }], totalAmount: 5 });
    expect(build(order).items[0].details).toBe('Tamanho: 39-42');
  });

  it('falha se faltar o artigo de um produto', () => {
    const order = makeOrder({ items: [{ productId: 'px', name: 'X', price: 5, quantity: 1, size: null, isGift: false }] });
    expect(() => build(order)).toThrow(/artigo/i);
  });
});

describe('verificação de totais', () => {
  it('totalsMatch aceita diferenças até 1 cêntimo', () => {
    expect(totalsMatch(10, 10.01)).toBe(true);
    expect(totalsMatch(10, 9.99)).toBe(true);
    expect(totalsMatch(10, 10.02)).toBe(false);
  });

  it('expectedSaleTotal soma preço × quantidade com o desconto de cada linha', () => {
    const total = expectedSaleTotal({
      items: [
        { id: 1, price: 10, quantity: 2, vat: 23, discount: 10 },
        { id: 2, price: 3.9, quantity: 1, vat: 23 },
      ],
    });
    expect(total).toBe(21.9);
  });
});

describe('invoiceBlocker', () => {
  it('bloqueia encomendas com total 0 (o Facturalusa recusa)', () => {
    expect(invoiceBlocker(makeOrder({ totalAmount: 0 }))).toMatch(/total/i);
  });

  it('bloqueia quando as linhas não batem com o total da encomenda', () => {
    expect(invoiceBlocker(makeOrder({ totalAmount: 50 }))).toMatch(/não corresponde/i);
  });

  it('não bloqueia uma encomenda normal', () => {
    expect(invoiceBlocker(makeOrder())).toBeNull();
  });
});

describe('utilitários', () => {
  it('lisbonDate usa o dia de Lisboa (depois da meia-noite no verão)', () => {
    expect(lisbonDate(new Date('2026-07-31T23:30:00Z'))).toBe('2026-08-01');
    expect(lisbonDate(new Date('2026-12-31T23:30:00Z'))).toBe('2026-12-31');
  });

  it('externalReference identifica a encomenda', () => {
    expect(externalReference('abc')).toBe('REAXONE-abc');
  });
});
