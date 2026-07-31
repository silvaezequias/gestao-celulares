import { Phone } from './types';

// A atribuição de WhatsApp (normal/business) guarda um id que pode ser tanto
// de um chip físico quanto de um número extra — essa função resolve pro
// número de fato, não importa a origem.
export function resolveNumberById(phone: Phone, id?: string): string | undefined {
  if (!id) return undefined;
  const chip = phone.chips.find((c) => c.id === id);
  if (chip) return chip.number;
  return phone.extraNumbers.find((e) => e.id === id)?.number;
}
