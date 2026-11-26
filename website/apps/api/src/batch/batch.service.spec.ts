import axios from 'axios';
import { BatchService } from './batch.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const ORDER = {
  phone: '911111111', email: 'a@b.pt', clientname: 'A B', address: 'Rua X', zipcode: '1050-227', city: 'Lisboa',
  external_id: 'o1', weight: 1000, volumes: 1, total: 10, cart: { 'Meias // M': 1 },
};

function tokens(...values: string[]) {
  for (const token of values) mockedAxios.post.mockResolvedValueOnce({ data: { error: false, token } });
}

function authHeaderOf(call: number): string {
  return (mockedAxios.request.mock.calls[call][0] as any).headers['Api-Auth'];
}

describe('BatchService — token e erros', () => {
  beforeEach(() => jest.resetAllMocks());

  it('reutiliza o token sem gerar outro (cada geração invalida o anterior)', async () => {
    tokens('t1');
    mockedAxios.request.mockResolvedValue({ status: 200, data: { error: false, status: 'entregue' } });
    const service = new BatchService();

    await service.getOrderStatus('017-1');
    await service.getOrderStatus('017-2');

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(authHeaderOf(1)).toBe('Bearer t1');
  });

  it('com 401 gera um token novo e repete o pedido uma vez', async () => {
    tokens('velho', 'novo');
    mockedAxios.request
      .mockResolvedValueOnce({ status: 401, data: { error: true, message: 'unauthorized' } })
      .mockResolvedValueOnce({ status: 200, data: { error: false, order_number: '017-9' } });
    const service = new BatchService();

    await expect(service.createOrder(ORDER)).resolves.toBe('017-9');
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    expect(authHeaderOf(0)).toBe('Bearer velho');
    expect(authHeaderOf(1)).toBe('Bearer novo');
  });

  it('pedidos em simultâneo partilham a mesma geração de token', async () => {
    tokens('t1');
    mockedAxios.request.mockResolvedValue({ status: 200, data: { error: false } });
    const service = new BatchService();

    await Promise.all([service.getOrderStatus('1'), service.getOrderTracking('2'), service.getStores()]);

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('não entra em ciclo: um segundo 401 desiste', async () => {
    tokens('t1', 't2');
    mockedAxios.request.mockResolvedValue({ status: 401, data: { error: true, message: 'unauthorized' } });
    const service = new BatchService();

    await expect(service.createOrder(ORDER)).resolves.toBeNull();
    expect(mockedAxios.request).toHaveBeenCalledTimes(2);
  });

  it('erro com HTTP 200 e error:true não é tratado como sucesso', async () => {
    tokens('t1');
    mockedAxios.request.mockResolvedValue({ status: 200, data: { error: true, message: 'CP ou telemóvel errados' } });
    const service = new BatchService();
    const logError = jest.spyOn((service as any).logger, 'error').mockImplementation(() => undefined);

    await expect(service.createOrder(ORDER)).resolves.toBeNull();
    expect(logError.mock.calls[0][0]).toContain('CP ou telemóvel errados');
  });

  it('envia os campos do envio e o carrinho como formulário', async () => {
    tokens('t1');
    mockedAxios.request.mockResolvedValue({ status: 200, data: { error: false, order_number: '017-1' } });
    const service = new BatchService();

    await service.createOrder(ORDER);

    const req = mockedAxios.request.mock.calls[0][0] as any;
    expect(req.url).toBe('https://mybatch.itsabatch.com/api/dispatch/order/create');
    const body = req.data.getBuffer().toString();
    expect(body).toContain('name="zipcode"\r\n\r\n1050-227');
    expect(body).toContain('name="cart[Meias // M]"\r\n\r\n1');
  });
});
