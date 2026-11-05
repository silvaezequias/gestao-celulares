import { NumberRecord, Phone, RecordKind } from './types';
import { normalizeDigits } from './search';

// Dois números são o mesmo quando batem os 8 últimos dígitos (o DDD e o +55
// podem faltar). Números cadastrados só com o final (ex.: "8602") batem
// quando o número completo termina com eles.
export function sameNumber(a: string, b: string): boolean {
  const da = normalizeDigits(a);
  const db = normalizeDigits(b);
  if (!da || !db) return false;
  if (da.length >= 8 && db.length >= 8) return da.slice(-8) === db.slice(-8);
  const [short, long] = da.length < db.length ? [da, db] : [db, da];
  return short.length >= 4 && long.endsWith(short);
}

/** últimos dígitos, pra listagem de aparelhos */
export function lastDigits(raw: string, count = 4): string {
  const d = normalizeDigits(raw);
  return d.length <= count ? d : d.slice(-count);
}

export interface Usage {
  phone: Phone;
  id: string;
  label: string;
  source: RecordKind;
  provider?: string;
  isNormal: boolean;
  isBusiness: boolean;
}

export function phoneUsages(phones: Phone[]): Usage[] {
  const out: Usage[] = [];
  for (const phone of phones) {
    for (const c of phone.chips) {
      if (!c.number.trim()) continue;
      out.push({
        phone,
        id: c.id,
        label: c.label || 'Chip',
        source: 'chip',
        isNormal: phone.whatsapp.normal === c.id,
        isBusiness: phone.whatsapp.business === c.id,
      });
    }
    for (const e of phone.extraNumbers) {
      if (!e.number.trim()) continue;
      out.push({
        phone,
        id: e.id,
        label: e.label || 'Extra',
        source: e.kind ?? 'whatsapp',
        provider: e.provider,
        isNormal: phone.whatsapp.normal === e.id,
        isBusiness: phone.whatsapp.business === e.id,
      });
    }
  }
  return out;
}

function usageNumber(u: Usage): string {
  return [...u.phone.chips, ...u.phone.extraNumbers].find((n) => n.id === u.id)?.number ?? '';
}

export interface NumberRow {
  key: string;
  /** número a exibir (o mais completo conhecido) */
  number: string;
  kind: RecordKind;
  record?: NumberRecord;
  usages: Usage[];
}

// Junta o cadastro de números com os números que aparecem nos aparelhos.
// Números usados em aparelhos mas ainda não cadastrados aparecem também
// (sem `record`), pra nada ficar de fora da listagem.
export function buildRows(records: NumberRecord[], phones: Phone[]): NumberRow[] {
  const usages = phoneUsages(phones);
  const used = new Set<Usage>();
  const rows: NumberRow[] = records.map((record) => {
    const mine = usages.filter((u) => sameNumber(record.number, usageNumber(u)));
    mine.forEach((u) => used.add(u));
    return { key: record.id, number: record.number, kind: record.kind, record, usages: mine };
  });

  const loose: NumberRow[] = [];
  for (const u of usages) {
    if (used.has(u)) continue;
    const num = usageNumber(u);
    const row = loose.find((r) => sameNumber(r.number, num));
    if (row) {
      row.usages.push(u);
      if (normalizeDigits(num).length > normalizeDigits(row.number).length) row.number = num;
    } else {
      loose.push({ key: `loose-${u.phone.id}-${u.id}`, number: num, kind: u.source, usages: [u] });
    }
  }
  return [...rows, ...loose];
}

