/**
 * URL da API para pedidos feitos no servidor Next (SSR, metadata, sitemap, feeds).
 *
 * NEXT_PUBLIC_API_URL é o endereço público, usado pelo browser. Dentro do servidor esse
 * endereço pode não ser alcançável (rede Docker, Cloudflare a bloquear IPs de datacenter),
 * por isso API_INTERNAL_URL — lido em runtime, não no build — permite apontar para a rede
 * interna, ex: http://api:3001/api.
 */
export function serverApiUrl(): string {
  return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
}
