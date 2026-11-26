import { batchServiceCode, detectZone, priceWithVat, quoteShipping } from './shipping-rates';

const HOME = { serviceCode: 'BL-14', serviceName: 'BATCH - Entrega ao Domicílio', priceBase: 4.01, isPickupPoint: false };
const POINT = { serviceCode: 'BL-12-8810769', serviceName: 'BATCH - Two Days Pick Up - Loja CTT Picoas (Lisboa)', priceBase: 3.61, isPickupPoint: true };
const THRESHOLDS = { pt: 50, es: 0, eu: 0 };

describe('priceWithVat', () => {
  it('soma 23% e arredonda ao cêntimo (preços da Batch vêm sem IVA)', () => {
    expect(priceWithVat(4.01)).toBe(4.93);
    expect(priceWithVat(3.61)).toBe(4.44);
    expect(priceWithVat(12.53)).toBe(15.41);
  });
});

describe('quoteShipping', () => {
  it('cobra o preço da Batch com IVA para o método escolhido', () => {
    expect(quoteShipping([HOME, POINT], 'BL-12-8810769', 'PT_CONTINENTAL', 10, THRESHOLDS))
      .toEqual({ serviceCode: 'BL-12-8810769', serviceName: POINT.serviceName, price: 4.44 });
  });

  it('portes grátis a partir do limite da zona', () => {
    expect(quoteShipping([HOME], 'BL-14', 'PT_CONTINENTAL', 50, THRESHOLDS)?.price).toBe(0);
    expect(quoteShipping([HOME], 'BL-14', 'PT_CONTINENTAL', 49.99, THRESHOLDS)?.price).toBe(4.93);
  });

  it('ilhas não têm portes grátis', () => {
    const islands = { ...HOME, serviceCode: 'BL-7', priceBase: 8.91 };
    expect(quoteShipping([islands], 'BL-7', 'PT_ILHAS', 500, THRESHOLDS)?.price).toBe(10.96);
  });

  it('recusa métodos que a Batch não devolveu para a morada, ou países bloqueados', () => {
    expect(quoteShipping([HOME], 'pt_2d_1t', 'PT_CONTINENTAL', 10, THRESHOLDS)).toBeNull();
    expect(quoteShipping([HOME], undefined, 'PT_CONTINENTAL', 10, THRESHOLDS)).toBeNull();
    expect(quoteShipping([HOME], 'BL-14', 'BLOCKED', 10, THRESHOLDS)).toBeNull();
  });
});

describe('detectZone', () => {
  it('Madeira/Açores e ilhas espanholas', () => {
    expect(detectZone('PT', '9000-018')).toBe('PT_ILHAS');
    expect(detectZone('ES', '07001')).toBe('ES_ILHAS');
    expect(detectZone('US', '10001')).toBe('BLOCKED');
  });
});

describe('batchServiceCode', () => {
  it('usa o código da Batch guardado na encomenda', () => {
    expect(batchServiceCode('BL-12-8810769', [HOME])).toBe('BL-12-8810769');
  });

  it('encomendas antigas (id da nossa tabela) usam a entrega ao domicílio', () => {
    expect(batchServiceCode('pt_2d_1t', [POINT, HOME])).toBe('BL-14');
    expect(batchServiceCode('pt_2d_1t', [POINT])).toBeNull();
  });
});
