// Levantamento em mão — sem portes, mediante marcação prévia por WhatsApp
export const PICKUP_METHOD_ID = 'pickup';
export const PICKUP_ADDRESS = 'Praça Clube, 2635-453 Rio de Mouro';

// Link wa.me para contactar o cliente; números PT de 9 dígitos ganham o indicativo 351
export function customerWhatsappUrl(phone: string, text?: string): string | null {
  let digits = (phone ?? '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 9 && digits.startsWith('9')) digits = `351${digits}`;
  if (digits.length < 9) return null;
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}
