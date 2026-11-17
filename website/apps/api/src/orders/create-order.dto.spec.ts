import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

// Mesmas opções do ValidationPipe global (main.ts)
const OPTIONS = { whitelist: true, forbidNonWhitelisted: true };

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    firstName: 'Ana', lastName: 'Silva', email: 'ana@exemplo.pt', phone: '912345678',
    street: 'Rua A, 1', city: 'Porto', postalCode: '4000-001', country: 'PT',
    paymentMethod: 'MBWAY', locale: 'pt', wantsInvoice: false, shippingMethod: 'ctt',
    gifts: [{ productId: 'g1', quantity: 1 }],
    // O checkout ainda envia name e price: são aceites e ignorados (o servidor recalcula)
    items: [{ productId: 'p1', name: 'Bola', price: 29.99, quantity: 2, size: 'M' }],
    ...overrides,
  };
}

async function errorsFor(body: Record<string, unknown>) {
  const errors = await validate(plainToInstance(CreateOrderDto, body), OPTIONS);
  return errors.map((e) => e.property);
}

describe('CreateOrderDto', () => {
  it('aceita o pedido que o checkout envia', async () => {
    expect(await errorsFor(validBody())).toEqual([]);
  });

  it('rejeita email inválido, textos enormes e método de pagamento desconhecido', async () => {
    expect(await errorsFor(validBody({ email: 'não-é-email' }))).toEqual(['email']);
    expect(await errorsFor(validBody({ street: 'x'.repeat(1000) }))).toEqual(['street']);
    expect(await errorsFor(validBody({ paymentMethod: 'BITCOIN' }))).toEqual(['paymentMethod']);
    expect(await errorsFor(validBody({ email: { $ne: '' } }))).toEqual(['email']);
  });

  it('valida as linhas: pelo menos uma, quantidade inteira e dentro do limite', async () => {
    expect(await errorsFor(validBody({ items: [] }))).toEqual(['items']);
    expect(await errorsFor(validBody({ items: [{ productId: 'p1', quantity: 1.5 }] }))).toEqual(['items']);
    expect(await errorsFor(validBody({ items: [{ productId: 'p1', quantity: 1000 }] }))).toEqual(['items']);
  });

  it('rejeita campos desconhecidos (ex.: tentar definir o total ou o utilizador)', async () => {
    expect(await errorsFor(validBody({ totalAmount: 0.01 }))).toEqual(['totalAmount']);
    expect(await errorsFor(validBody({ userId: 'outro' }))).toEqual(['userId']);
  });
});
