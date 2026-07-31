// Paleta de acabamentos (frame + tela) usada na miniatura do celular.
// A cor é derivada de um hash do nome+modelo, então o mesmo aparelho
// sempre recebe a mesma cor, sem precisar de um seletor manual.
export interface PhoneFinish {
  name: string;
  frame: string;
  frameLight: string;
}

export const PHONE_FINISHES: PhoneFinish[] = [
  { name: 'Grafite', frame: '#1f2430', frameLight: '#3a4152' },
  { name: 'Prata', frame: '#c7cdd6', frameLight: '#e8ebef' },
  { name: 'Dourado', frame: '#c9a463', frameLight: '#e3cd9a' },
  { name: 'Azul Meia-Noite', frame: '#22314f', frameLight: '#3d517c' },
  { name: 'Verde', frame: '#2f4a3c', frameLight: '#4c705d' },
  { name: 'Roxo', frame: '#4a3a63', frameLight: '#725a92' },
  { name: 'Vermelho', frame: '#5c2530', frameLight: '#8a3b48' },
  { name: 'Titânio', frame: '#5b5c5e', frameLight: '#84868a' },
  { name: 'Azul', frame: '#284b63', frameLight: '#3f7594' },
  { name: 'Preto', frame: '#111318', frameLight: '#2a2e38' },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function finishFor(seed: string): PhoneFinish {
  const idx = hashString(seed) % PHONE_FINISHES.length;
  return PHONE_FINISHES[idx];
}

// Presets rápidos para o seletor de cor da capinha.
export const CASE_COLOR_PRESETS: string[] = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#64748b', '#0f172a',
];

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, n));
}

// Clareia um hex por uma fração (0-1), usado pra gerar o brilho do
// gradiente da capinha a partir da cor escolhida pelo usuário.
export function lighten(hex: string, amount: number): string {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return hex;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const nr = clamp255(Math.round(r + (255 - r) * amount));
  const ng = clamp255(Math.round(g + (255 - g) * amount));
  const nb = clamp255(Math.round(b + (255 - b) * amount));
  return `#${[nr, ng, nb].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function finishForCase(seed: string, caseColor?: string): PhoneFinish {
  if (caseColor) {
    return { name: 'Capinha personalizada', frame: caseColor, frameLight: lighten(caseColor, 0.35) };
  }
  return finishFor(seed);
}
