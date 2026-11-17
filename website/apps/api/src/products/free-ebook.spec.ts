import { isFreeEbook } from './free-ebook';

describe('isFreeEbook', () => {
  it('is true for an ebook with a file and price 0', () => {
    expect(isFreeEbook({ price: 0, ebookFile: 'ebooks/a.pdf' })).toBe(true);
  });

  it('is true for a product in the ebooks category with price 0', () => {
    expect(isFreeEbook({ price: 0, category: { slug: 'ebooks' } })).toBe(true);
  });

  it('is false for a paid ebook', () => {
    expect(isFreeEbook({ price: 9.99, ebookFile: 'ebooks/a.pdf' })).toBe(false);
  });

  it('is false for a free product that is not an ebook', () => {
    expect(isFreeEbook({ price: 0, category: { slug: 'acessorios' } })).toBe(false);
  });
});
