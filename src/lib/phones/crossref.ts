import { NumberKind, Phone } from './types';
import { normalizeDigits } from './search';

export type NumberSourceType = 'chip' | 'extra';

// Uma ocorrência de um número em algum lugar do sistema — pode ser o chip
// físico de um celular ou um número extra cadastrado só pro WhatsApp.
export interface NumberOccurrence {
  phone: Phone;
  sourceType: NumberSourceType;
  sourceId: string;
  label: string;
  number: string;
  isNormal: boolean;
  isBusiness: boolean;
  kind?: NumberKind;
}

// Uma linha da listagem de chips: um chip físico específico de um celular.
export interface ChipEntry {
  phone: Phone;
  chip: Phone['chips'][number];
  isNormal: boolean;
  isBusiness: boolean;
}

// Indexa toda ocorrência de número (chip ou extra) em todos os celulares,
// agrupado pelos dígitos normalizados — permite descobrir se o mesmo número
// aparece em mais de um lugar (ex: chip físico num celular, mas usado como
// WhatsApp Business em outro).
export function buildNumberIndex(phones: Phone[]): Map<string, NumberOccurrence[]> {
  const index = new Map<string, NumberOccurrence[]>();

  const add = (phone: Phone, occurrence: NumberOccurrence) => {
    const key = normalizeDigits(occurrence.number);
    if (!key) return;
    const list = index.get(key) ?? [];
    list.push(occurrence);
    index.set(key, list);
  };

  for (const phone of phones) {
    for (const chip of phone.chips) {
      if (!chip.number.trim()) continue;
      add(phone, {
        phone,
        sourceType: 'chip',
        sourceId: chip.id,
        label: chip.label,
        number: chip.number,
        isNormal: phone.whatsapp.normal === chip.id,
        isBusiness: phone.whatsapp.business === chip.id,
      });
    }
    for (const extra of phone.extraNumbers) {
      if (!extra.number.trim()) continue;
      add(phone, {
        phone,
        sourceType: 'extra',
        sourceId: extra.id,
        label: extra.label || 'Extra',
        kind: extra.kind ?? 'whatsapp',
        number: extra.number,
        isNormal: phone.whatsapp.normal === extra.id,
        isBusiness: phone.whatsapp.business === extra.id,
      });
    }
  }

  return index;
}

// Lista achatada de todos os chips físicos (um item por chip), com a
// atribuição de WhatsApp já resolvida no próprio celular dele.
export function listAllChips(phones: Phone[]): ChipEntry[] {
  const entries: ChipEntry[] = [];
  for (const phone of phones) {
    for (const chip of phone.chips) {
      if (!chip.number.trim()) continue;
      entries.push({
        phone,
        chip,
        isNormal: phone.whatsapp.normal === chip.id,
        isBusiness: phone.whatsapp.business === chip.id,
      });
    }
  }
  return entries;
}

// Outras ocorrências do mesmo número, em qualquer celular, excluindo a
// origem informada (o próprio chip que está sendo consultado).
export function findOtherOccurrences(
  index: Map<string, NumberOccurrence[]>,
  number: string,
  excludeSourceId: string
): NumberOccurrence[] {
  const key = normalizeDigits(number);
  const all = index.get(key) ?? [];
  return all.filter((occ) => occ.sourceId !== excludeSourceId);
}
