import { ebookFilesForOrder, isValidEbookKey, watermarkText } from './ebook-files';

describe('isValidEbookKey', () => {
  it.each([
    'padel.pdf',
    'ebooks/padel-sem-lesoes-pt.pdf',
    'ebooks/Test Your Performance EN.PDF',
  ])('accepts %s', (key) => {
    expect(isValidEbookKey(key)).toBe(true);
  });

  it.each([
    '',
    'ebooks/padel.docx',
    '/ebooks/padel.pdf',
    'ebooks/../secret.pdf',
    'ebooks//padel.pdf',
    'https://bucket.example.com/padel.pdf',
    `${'a'.repeat(300)}.pdf`,
  ])('rejects %s', (key) => {
    expect(isValidEbookKey(key)).toBe(false);
  });
});

describe('ebookFilesForOrder', () => {
  const ebook = (overrides: object = {}) => ({
    productId: 'p1',
    product: { name: 'Padel sem lesões', slug: 'padel-sem-lesoes', ebookFile: 'ebooks/pt.pdf', ebookFileEn: null, ...overrides },
  });

  it('ignores items without an ebook file', () => {
    const files = ebookFilesForOrder([
      { productId: 'socks', product: { name: 'Meias', slug: 'meias', ebookFile: null, ebookFileEn: null } },
      { productId: 'gone', product: null },
    ]);
    expect(files).toEqual([]);
  });

  it('names a single-language file after the product slug', () => {
    expect(ebookFilesForOrder([ebook()])).toEqual([
      { productId: 'p1', title: 'Padel sem lesões', key: 'ebooks/pt.pdf', filename: 'padel-sem-lesoes.pdf' },
    ]);
  });

  it('attaches both languages when both files exist', () => {
    const files = ebookFilesForOrder([ebook({ ebookFileEn: 'ebooks/en.pdf' })]);
    expect(files.map((f) => [f.key, f.filename])).toEqual([
      ['ebooks/pt.pdf', 'padel-sem-lesoes-pt.pdf'],
      ['ebooks/en.pdf', 'padel-sem-lesoes-en.pdf'],
    ]);
  });

  it('attaches each product once even when it appears in several lines', () => {
    expect(ebookFilesForOrder([ebook(), ebook()])).toHaveLength(1);
  });

  it('skips keys that are not valid bucket keys', () => {
    expect(ebookFilesForOrder([ebook({ ebookFile: '../etc/passwd' })])).toEqual([]);
  });
});

describe('watermarkText', () => {
  it('includes the customer email and the short order reference', () => {
    expect(watermarkText('ana@example.com', 'cmw9d6xo20000pg01yd37nw46'))
      .toBe('Licenciado a ana@example.com - Encomenda #YD37NW46');
  });

  it('replaces characters the standard PDF font cannot draw', () => {
    expect(watermarkText('joão@exemplo.pt', 'abcdefgh'))
      .toBe('Licenciado a jo?o@exemplo.pt - Encomenda #ABCDEFGH');
  });
});
