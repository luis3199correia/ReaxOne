import { batchCart, batchCountryName, canMarkReadyForPickup, needsBatchShipment } from './batch-shipment';

describe('batchCountryName', () => {
  it('converte o código ISO para o nome em inglês', () => {
    expect(batchCountryName('PT')).toBe('Portugal');
    expect(batchCountryName('es')).toBe('Spain');
    expect(batchCountryName('IE')).toBe('Ireland');
    expect(batchCountryName(null)).toBe('Portugal');
  });
});

describe('batchCart', () => {
  it('usa "Nome // SKU" e soma o mesmo produto comprado e de oferta', () => {
    const cart = batchCart([
      { name: 'Meias Rosa', sku: 'RX-0010', quantity: 2 },
      { name: 'Meias Rosa', sku: 'RX-0010', quantity: 1 },
      { name: 'Bola Verde', sku: 'RX-0001', quantity: 1 },
    ]);
    expect(cart.items).toEqual({ 'Meias Rosa // RX-0010': 3, 'Bola Verde // RX-0001': 1 });
    expect(cart.missingSku).toEqual([]);
  });

  it('assinala produtos sem SKU', () => {
    expect(batchCart([{ name: 'Bola', sku: null, quantity: 1 }]).missingSku).toEqual(['Bola']);
  });
});

describe('needsBatchShipment', () => {
  it('envia encomendas pagas com entrega por transportadora, qualquer que seja o pagamento', () => {
    expect(needsBatchShipment({ shippingMethod: 'BL-14', batchOrderNumber: null })).toBe(true);
    expect(needsBatchShipment({ shippingMethod: 'BL-12-8810914' })).toBe(true);
  });

  it('não envia o levantamento no clube', () => {
    expect(needsBatchShipment({ shippingMethod: 'pickup', batchOrderNumber: null })).toBe(false);
  });

  it('não envia de novo uma encomenda que já está na Batch', () => {
    expect(needsBatchShipment({ shippingMethod: 'BL-14', batchOrderNumber: '1409-6' })).toBe(false);
  });
});

describe('canMarkReadyForPickup', () => {
  const onHold = { status: 'PAID', batchOrderNumber: '1409-6', batchStatus: 'em espera' };

  it('permite marcar uma encomenda paga que está em espera na Batch', () => {
    expect(canMarkReadyForPickup(onHold)).toBe(true);
  });

  it('não permite sem encomenda na Batch', () => {
    expect(canMarkReadyForPickup({ ...onHold, batchOrderNumber: null })).toBe(false);
  });

  it('não permite quando já está pronta para recolha (ou é antiga, sem estado guardado)', () => {
    expect(canMarkReadyForPickup({ ...onHold, batchStatus: 'pronta para recolha' })).toBe(false);
    expect(canMarkReadyForPickup({ ...onHold, batchStatus: null })).toBe(false);
  });

  it('não permite em encomendas canceladas', () => {
    expect(canMarkReadyForPickup({ ...onHold, status: 'CANCELLED' })).toBe(false);
  });
});
