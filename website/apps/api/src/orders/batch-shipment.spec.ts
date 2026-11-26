import { batchCart, batchCountryName } from './batch-shipment';

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
