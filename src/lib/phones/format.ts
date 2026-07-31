// Formatação de número de telefone brasileiro (DDD + número), tanto pra
// exibição nos cards quanto pra máscara progressiva enquanto o usuário
// digita no formulário.
import { normalizeDigits } from './search';

export function formatPhoneNumber(raw: string): string {
  const digits = normalizeDigits(raw);

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12 && digits.startsWith('55')) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  // Comprimento fora do padrão (número incompleto, internacional, etc.):
  // mantém como foi digitado em vez de arriscar um agrupamento errado.
  return raw;
}

// Máscara progressiva aplicada enquanto o usuário digita no input. Também
// aceita cadastrar só os 4 últimos dígitos (sem DDD) — nesse caso não faz
// sentido tentar formatar como se os 2 primeiros dígitos fossem um DDD, então
// só formata como número completo a partir do 5º dígito digitado.
export function maskPhoneNumber(raw: string): string {
  const digits = normalizeDigits(raw).slice(0, 11);
  const len = digits.length;

  if (len === 0) return '';
  if (len <= 4) return digits;
  if (len <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (len <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}
