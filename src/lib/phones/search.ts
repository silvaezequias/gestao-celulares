// Busca de número de telefone: as pessoas normalmente pesquisam só os
// últimos 4 dígitos, então a comparação ignora toda formatação (espaços,
// parênteses, traço, +55, etc.) e casa a query em qualquer posição do
// número, não só no início.
export function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function numberMatchesQuery(number: string, query: string): boolean {
  const queryDigits = normalizeDigits(query);
  if (!queryDigits) return false;
  return normalizeDigits(number).includes(queryDigits);
}

// Acha o trecho (em índices da string original, com formatação) que
// corresponde à busca, pra poder destacar visualmente o match.
export function findMatchRange(raw: string, query: string): [number, number] | null {
  const queryDigits = normalizeDigits(query);
  if (!queryDigits) return null;

  const digitPositions: number[] = [];
  let digitsOnly = '';
  for (let i = 0; i < raw.length; i++) {
    if (/\d/.test(raw[i])) {
      digitsOnly += raw[i];
      digitPositions.push(i);
    }
  }

  const idx = digitsOnly.indexOf(queryDigits);
  if (idx === -1) return null;

  const start = digitPositions[idx];
  const end = digitPositions[idx + queryDigits.length - 1] + 1;
  return [start, end];
}
