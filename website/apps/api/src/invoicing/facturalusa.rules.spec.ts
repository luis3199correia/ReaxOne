import { DEFAULT_FACTURALUSA_API_URL, extractApiError, isNotFoundResponse, readFacturalusaConfig } from './facturalusa.rules';

describe('readFacturalusaConfig', () => {
  it('sem variáveis: sem chave e com o URL por omissão', () => {
    expect(readFacturalusaConfig({})).toEqual({ apiKey: '', apiUrl: DEFAULT_FACTURALUSA_API_URL });
  });

  it('lê a chave sem espaços e o URL sem a barra final', () => {
    const config = readFacturalusaConfig({
      FACTURALUSA_API_KEY: '  abc123  ',
      FACTURALUSA_API_URL: 'https://sandbox.example.pt/api/v2/ ',
    });
    expect(config).toEqual({ apiKey: 'abc123', apiUrl: 'https://sandbox.example.pt/api/v2' });
  });

  it('ignora URLs que não sejam https', () => {
    expect(readFacturalusaConfig({ FACTURALUSA_API_URL: 'http://x.pt' }).apiUrl).toBe(DEFAULT_FACTURALUSA_API_URL);
  });
});

describe('extractApiError', () => {
  it('usa a mensagem da API', () => {
    expect(extractApiError({ message: 'Introduza pelo menos um artigo' })).toBe('Introduza pelo menos um artigo');
  });

  it('junta os erros de validação', () => {
    expect(extractApiError({ errors: { customer: ['Obrigatório'], items: 'Inválido' } })).toBe('Obrigatório; Inválido');
  });

  it('aceita texto simples e corta mensagens longas', () => {
    expect(extractApiError('Erro')).toBe('Erro');
    expect(extractApiError('x'.repeat(600))).toHaveLength(500);
  });

  it('devolve null quando não há mensagem', () => {
    expect(extractApiError(undefined)).toBeNull();
    expect(extractApiError({})).toBeNull();
  });
});

describe('isNotFoundResponse', () => {
  it('404 ou 400 com "não encontrado" contam como inexistente', () => {
    expect(isNotFoundResponse(404, null)).toBe(true);
    expect(isNotFoundResponse(400, 'O cliente não foi encontrado')).toBe(true);
  });

  it('outros erros não', () => {
    expect(isNotFoundResponse(400, 'Introduza pelo menos um artigo')).toBe(false);
    expect(isNotFoundResponse(500, 'não encontrado')).toBe(false);
    expect(isNotFoundResponse(null, null)).toBe(false);
  });
});
