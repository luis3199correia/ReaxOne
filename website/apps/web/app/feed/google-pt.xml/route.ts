import { googleFeedResponse } from '@/lib/googleFeed';

// Gerado a pedido; os produtos vêm da API com cache de 1h (novos produtos entram sozinhos)
export const dynamic = 'force-dynamic';

export function GET() {
  return googleFeedResponse('pt');
}
