import { BATCH_CSV_HEADER, buildBatchCatalogCsv, nextSku } from './batch-catalog';

describe('nextSku', () => {
  it('começa em RX-0001', () => {
    expect(nextSku([])).toBe('RX-0001');
  });

  it('segue o maior número existente e ignora SKUs manuais', () => {
    expect(nextSku(['RX-0002', null, 'RX-0010', 'MEIA-AZUL', undefined])).toBe('RX-0011');
  });

  it('passa dos 4 dígitos sem perder a ordem', () => {
    expect(nextSku(['RX-9999'])).toBe('RX-10000');
  });
});

describe('buildBatchCatalogCsv', () => {
  const sock = {
    id: 'c1', name: 'Meias ReaxOne, Branco/Preto', sku: 'RX-0001', price: 7.5,
    images: ['/api/images/serve/images/fotos/meia branca.jpeg'], category: { slug: 'meias' },
  };
  const ebook = { id: 'c2', name: 'Ebook', sku: 'RX-0002', price: 5.99, images: [], category: { slug: 'ebooks' } };

  it('usa o cabeçalho do template da Batch', () => {
    const [header] = buildBatchCatalogCsv([]).split('\n');
    expect(header).toBe('BARCODE,NAME,SKU,ECOMMERCE SKU,ECOMMERCE ID,PRICE,URL DA IMAGEM,BUNDLE (0/1)');
    expect(BATCH_CSV_HEADER).toHaveLength(8);
  });

  it('exporta só produtos físicos, com SKU, id, preço e imagem absoluta', () => {
    const lines = buildBatchCatalogCsv([sock, ebook], 'https://reaxone.com/').trim().split('\n');

    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(
      ',"Meias ReaxOne, Branco/Preto",RX-0001,RX-0001,c1,7.50,https://reaxone.com/api/images/serve/images/fotos/meia%20branca.jpeg,0',
    );
  });

  it('escapa aspas e aceita produto sem imagem nem SKU', () => {
    const line = buildBatchCatalogCsv([{ ...sock, name: 'Bola "Pro"', sku: null, images: [] }]).trim().split('\n')[1];
    expect(line).toBe(',"Bola ""Pro""",,,c1,7.50,,0');
  });
});
