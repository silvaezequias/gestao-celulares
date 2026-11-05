// Catálogo de desenhos de aparelhos usado pelas miniaturas.
//
// Cada família de modelo descreve, num sistema de coordenadas fixo de
// 100 x 200 (corpo do aparelho), como é a frente (tipo de recorte da câmera
// frontal / bordas) e o verso (módulo de câmera, lentes, flash e logotipo).
// O texto do modelo digitado no cadastro é casado contra as regras abaixo,
// na ordem — a primeira que bater define o desenho.

export type Brand = 'apple' | 'samsung' | 'xiaomi' | 'motorola' | 'lg' | 'google' | 'other';

export type FrontStyle =
  | 'island' // Dynamic Island (iPhone 14 Pro em diante)
  | 'notch' // entalhe largo (iPhone X a 14)
  | 'punch' // furo central
  | 'drop' // gota (Galaxy A, Redmi A...)
  | 'home' // bordas grossas com botão home (iPhone SE/8)
  | 'bezel'; // bordas grossas sem botão (Android antigo)

export type BackShape =
  | { t: 'module'; x: number; y: number; w: number; h: number; r: number }
  | { t: 'ring'; cx: number; cy: number; r: number }
  | { t: 'lens'; cx: number; cy: number; r: number; ring?: boolean }
  | { t: 'flash'; cx: number; cy: number; r: number }
  | { t: 'dot'; cx: number; cy: number; r: number }
  | { t: 'logo'; kind: 'apple' | 'moto' | 'google' }
  | { t: 'text'; text: string; y: number; size?: number; x?: number; anchor?: 'middle' | 'start' };

export interface DeviceSpec {
  key: string;
  brand: Brand;
  family: string; // nome amigável da família, exibido no formulário
  radius: number;
  front: FrontStyle;
  back: BackShape[];
}

// ---------- Blocos reutilizáveis ----------

const lens = (cx: number, cy: number, r: number, ring = false): BackShape => ({ t: 'lens', cx, cy, r, ring });
const flash = (cx: number, cy: number, r = 2.4): BackShape => ({ t: 'flash', cx, cy, r });
const mod = (x: number, y: number, w: number, h: number, r: number): BackShape => ({ t: 'module', x, y, w, h, r });
const text = (value: string, y = 168, size = 5.5): BackShape => ({ t: 'text', text: value, y, size });

const SPECS = {
  // ---------------- Apple ----------------
  iphoneHome: {
    brand: 'apple', family: 'iPhone com botão Home', radius: 14, front: 'home',
    back: [lens(16, 15, 5, true), flash(27, 15, 2.2), { t: 'logo', kind: 'apple' }],
  },
  iphoneSingle: {
    brand: 'apple', family: 'iPhone (câmera única)', radius: 17, front: 'notch',
    back: [mod(8, 7, 22, 22, 7), lens(19, 18, 6), flash(26, 11, 1.4), { t: 'logo', kind: 'apple' }],
  },
  iphoneDual: {
    brand: 'apple', family: 'iPhone (câmera dupla)', radius: 17, front: 'notch',
    back: [mod(8, 7, 34, 34, 10), lens(18, 17, 6.3), lens(32, 31, 6.3), flash(32, 16, 2.4), { t: 'logo', kind: 'apple' }],
  },
  iphoneDualIsland: {
    brand: 'apple', family: 'iPhone (câmera dupla)', radius: 17, front: 'island',
    back: [mod(8, 7, 34, 34, 10), lens(18, 17, 6.3), lens(32, 31, 6.3), flash(32, 16, 2.4), { t: 'logo', kind: 'apple' }],
  },
  iphoneVertical: {
    brand: 'apple', family: 'iPhone (câmera vertical)', radius: 18, front: 'island',
    back: [mod(8, 7, 20, 40, 10), lens(18, 17, 6.3), lens(18, 37, 6.3), flash(32, 14, 2.2), { t: 'logo', kind: 'apple' }],
  },
  iphonePro: {
    brand: 'apple', family: 'iPhone Pro', radius: 17, front: 'notch',
    back: [
      mod(7, 6, 42, 42, 12),
      lens(18, 17, 7), lens(18, 37, 7), lens(37, 27, 7),
      flash(38, 13, 2.4), { t: 'dot', cx: 38, cy: 41, r: 2.4 },
      { t: 'logo', kind: 'apple' },
    ],
  },
  iphoneProIsland: {
    brand: 'apple', family: 'iPhone Pro', radius: 18, front: 'island',
    back: [
      mod(7, 6, 44, 44, 13),
      lens(18.5, 17.5, 7.5), lens(18.5, 38.5, 7.5), lens(38.5, 28, 7.5),
      flash(39.5, 13, 2.4), { t: 'dot', cx: 39.5, cy: 43, r: 2.4 },
      { t: 'logo', kind: 'apple' },
    ],
  },
  iphone17Pro: {
    brand: 'apple', family: 'iPhone 17 Pro', radius: 18, front: 'island',
    back: [
      mod(5, 5, 90, 46, 14),
      lens(17, 16, 7.5), lens(17, 38, 7.5), lens(36, 27, 7.5),
      flash(80, 16, 2.6), { t: 'dot', cx: 80, cy: 38, r: 2.4 },
      { t: 'logo', kind: 'apple' },
    ],
  },
  iphoneAir: {
    brand: 'apple', family: 'iPhone Air', radius: 18, front: 'island',
    back: [mod(5, 6, 90, 22, 11), lens(17, 17, 6.5), flash(30, 17, 2.2), { t: 'logo', kind: 'apple' }],
  },

  // ---------------- Samsung ----------------
  galaxyA06: {
    brand: 'samsung', family: 'Galaxy A (2 lentes soltas)', radius: 12, front: 'drop',
    back: [lens(16, 16, 7, true), lens(16, 35, 7, true), flash(29, 16, 2.2), text('SAMSUNG')],
  },
  galaxyTriple: {
    brand: 'samsung', family: 'Galaxy (3 lentes soltas)', radius: 12, front: 'drop',
    back: [lens(16, 16, 7, true), lens(16, 35, 7, true), lens(16, 54, 7, true), flash(29, 16, 2.2), text('SAMSUNG')],
  },
  galaxyTriplePunch: {
    brand: 'samsung', family: 'Galaxy (3 lentes soltas)', radius: 13, front: 'punch',
    back: [lens(16, 16, 7, true), lens(16, 35, 7, true), lens(16, 54, 7, true), flash(29, 16, 2.2), text('SAMSUNG')],
  },
  galaxyPill: {
    brand: 'samsung', family: 'Galaxy A (módulo vertical)', radius: 12, front: 'drop',
    back: [mod(8, 7, 20, 44, 10), lens(18, 17, 6), lens(18, 32, 6), flash(18, 44.5, 2.2), text('SAMSUNG')],
  },
  galaxyPillLong: {
    brand: 'samsung', family: 'Galaxy A (módulo vertical)', radius: 12, front: 'drop',
    back: [mod(8, 7, 20, 58, 10), lens(18, 17, 6), lens(18, 31, 6), lens(18, 45, 5), flash(18, 57, 2.2), text('SAMSUNG')],
  },
  galaxyS20: {
    brand: 'samsung', family: 'Galaxy S20 / S21', radius: 13, front: 'punch',
    back: [mod(6, 6, 30, 52, 10), lens(16, 17, 6.3), lens(16, 32, 6.3), lens(16, 47, 6.3), flash(28.5, 17, 2.2), { t: 'dot', cx: 28.5, cy: 25, r: 1.5 }, text('SAMSUNG')],
  },

  // ---------------- Xiaomi / Redmi / Poco ----------------
  redmiA: {
    brand: 'xiaomi', family: 'Redmi A (câmera redonda)', radius: 13, front: 'drop',
    back: [{ t: 'ring', cx: 50, cy: 28, r: 19 }, lens(44, 28, 7.5), { t: 'dot', cx: 58, cy: 22, r: 2.5 }, flash(58, 34, 2.4), text('Redmi', 168, 6)],
  },
  redmiNote12: {
    brand: 'xiaomi', family: 'Redmi Note', radius: 13, front: 'punch',
    back: [mod(7, 6, 32, 42, 9), lens(18, 17, 7.5), lens(18, 36, 5.5), lens(31, 36, 3.6), flash(31, 15, 2.2), text('Redmi', 168, 6)],
  },
  redmi12c: {
    brand: 'xiaomi', family: 'Redmi (módulo quadrado)', radius: 13, front: 'drop',
    back: [mod(7, 6, 34, 34, 9), lens(17.5, 16.5, 6), lens(30.5, 16.5, 6), lens(17.5, 29.5, 3.5), flash(30.5, 29.5, 2.2), text('Redmi', 168, 6)],
  },
  redmiNote13: {
    brand: 'xiaomi', family: 'Redmi Note 13', radius: 13, front: 'punch',
    back: [lens(17, 17, 8, true), lens(17, 38, 8, true), lens(17, 55, 4.5, true), flash(31, 15, 2.2), text('Redmi', 168, 6)],
  },
  poco: {
    brand: 'xiaomi', family: 'Poco', radius: 13, front: 'punch',
    back: [mod(5, 6, 90, 26, 11), lens(18, 19, 7), lens(35, 19, 5.5), lens(49, 19, 4), flash(62, 19, 2.2), { t: 'text', text: 'POCO', y: 21.5, size: 6.5, x: 82, anchor: 'middle' }],
  },
  xiaomiFlagship: {
    brand: 'xiaomi', family: 'Xiaomi (topo de linha)', radius: 14, front: 'punch',
    back: [mod(6, 6, 50, 50, 14), lens(19, 19, 9), lens(43, 19, 9), lens(19, 43, 9), lens(43, 43, 5), text('Xiaomi', 168, 6)],
  },
  xiaomiGeneric: {
    brand: 'xiaomi', family: 'Xiaomi', radius: 13, front: 'drop',
    back: [mod(7, 6, 32, 42, 9), lens(18, 17, 7), lens(18, 35, 5.5), flash(31, 15, 2.2), text('Xiaomi', 168, 6)],
  },

  // ---------------- Motorola ----------------
  moto: {
    brand: 'motorola', family: 'Motorola', radius: 14, front: 'punch',
    back: [mod(7, 6, 38, 38, 11), lens(18, 17, 6.5), lens(34, 17, 6.5), lens(18, 33, 5), flash(34, 33, 2.4), { t: 'logo', kind: 'moto' }],
  },

  // ---------------- LG ----------------
  lgClassic: {
    brand: 'lg', family: 'LG K (clássico)', radius: 12, front: 'bezel',
    back: [lens(50, 17, 5.5, true), flash(63, 17, 2.2), { t: 'dot', cx: 37, cy: 17, r: 1.4 }, text('LG', 170, 8)],
  },
  lgModern: {
    brand: 'lg', family: 'LG K (módulo quadrado)', radius: 12, front: 'punch',
    back: [mod(7, 6, 34, 34, 9), lens(17.5, 16.5, 5.5), lens(30.5, 16.5, 5.5), lens(17.5, 29.5, 4.5), flash(30.5, 29.5, 2.2), text('LG', 170, 8)],
  },

  // ---------------- Google ----------------
  pixel: {
    brand: 'google', family: 'Google Pixel', radius: 15, front: 'punch',
    back: [mod(4, 22, 92, 20, 10), lens(22, 32, 6), lens(38, 32, 6), flash(80, 32, 2.4), { t: 'logo', kind: 'google' }],
  },

  // ---------------- Genérico ----------------
  generic: {
    brand: 'other', family: 'Android', radius: 13, front: 'punch',
    back: [mod(7, 6, 22, 44, 10), lens(18, 17, 6.5), lens(18, 33, 5.5), flash(18, 45, 2.2)],
  },
} satisfies Record<string, Omit<DeviceSpec, 'key'>>;

type SpecKey = keyof typeof SPECS;

// Regras de reconhecimento (ordem importa: das mais específicas para as mais
// genéricas). Tolerante a erros comuns de digitação ("Xiomi", "Iphone S").
const RULES: [RegExp, SpecKey][] = [
  // Apple
  [/iphone\s*17\s*pro/i, 'iphone17Pro'],
  [/iphone\s*air/i, 'iphoneAir'],
  [/iphone\s*16e/i, 'iphoneSingle'],
  [/iphone\s*(1[5-7])\s*pro/i, 'iphoneProIsland'],
  [/iphone\s*14\s*pro/i, 'iphoneProIsland'],
  [/iphone\s*(1[1-3])\s*pro/i, 'iphonePro'],
  [/iphone\s*(16|17)/i, 'iphoneVertical'],
  [/iphone\s*15/i, 'iphoneDualIsland'],
  [/iphone\s*(1[1-4])/i, 'iphoneDual'],
  [/iphone\s*(xr)\b/i, 'iphoneSingle'],
  [/iphone\s*(x|xs)\b/i, 'iphoneDual'],
  [/iphone\s*(se|s|[5-8]|[5-8]\s*plus|[5-8]s)\b/i, 'iphoneHome'],
  [/iphone|apple/i, 'iphoneDualIsland'],

  // Samsung
  [/\bs2[01]\b|s20\s*fe|s21\s*fe/i, 'galaxyS20'],
  [/\ba0[4-7]s?\b/i, 'galaxyA06'],
  [/\ba0[0-3]s?\b|\ba1[0-3]s?\b|\ba2[0-1]s?\b|\bm1[0-3]\b/i, 'galaxyPill'],
  [/\ba[3-5]0s?\b|\ba[23]1\b|\ba[57]1\b/i, 'galaxyPillLong'],
  [/\ba1[4-7]\b|\ba2[4-6]\b|\bm[1-5][45]\b/i, 'galaxyTriple'],
  [/\ba[3-5][3-6]\b|\bs2[2-6]|\bs23\b|galaxy\s*s/i, 'galaxyTriplePunch'],
  [/samsung|galaxy/i, 'galaxyTriple'],

  // Xiaomi
  [/poco/i, 'poco'],
  [/(redmi|xiaomi|xiomi|xaomi|xiami).*note\s*1[3-5]/i, 'redmiNote13'],
  [/(redmi|xiaomi|xiomi|xaomi|xiami).*note/i, 'redmiNote12'],
  [/(redmi|xiaomi|xiomi|xaomi|xiami)\s*a\s*\d/i, 'redmiA'],
  [/(redmi|xiaomi|xiomi|xaomi|xiami).*1[0-4]\s*c\b/i, 'redmi12c'],
  [/redmi/i, 'redmi12c'],
  [/(xiaomi|xiomi|xaomi|xiami)\s*1[1-7]/i, 'xiaomiFlagship'],
  [/xiaomi|xiomi|xaomi|xiami|\bmi\b/i, 'xiaomiGeneric'],

  // Motorola
  [/motorola|\bmoto\b|razr|edge/i, 'moto'],

  // LG
  [/\blg\b.*k\s*(4[0-9]|5[0-9]|6[0-9]|7[0-9])/i, 'lgModern'],
  [/\blg\b|\bk\s*[0-9]{1,2}\b/i, 'lgClassic'],

  // Google
  [/pixel|google/i, 'pixel'],
];

export function resolveDevice(model: string): DeviceSpec {
  const value = (model || '').trim();
  for (const [re, key] of RULES) {
    if (re.test(value)) return { key, ...SPECS[key] } as DeviceSpec;
  }
  return { key: 'generic', ...SPECS.generic } as DeviceSpec;
}

// ---------- Cores ----------

// Acabamentos padrão para quando o aparelho não tem cor de capinha definida.
// O mesmo aparelho sempre recebe a mesma cor (hash do nome + modelo).
export const DEFAULT_FINISHES = ['#2b2f38', '#c9ced6', '#3b4a6b', '#55615a', '#6b5b7b', '#8a7660', '#1f2937', '#e5e1da'];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function bodyColorFor(seed: string, caseColor?: string): string {
  if (caseColor) return caseColor;
  return DEFAULT_FINISHES[hashString(seed) % DEFAULT_FINISHES.length];
}

function parseHex(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n.padEnd(6, '0');
  const num = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(num)) return [100, 100, 100];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')}`;
}

export function mix(a: string, b: string, amount: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  return toHex([0, 1, 2].map((i) => ca[i] + (cb[i] - ca[i]) * amount) as [number, number, number]);
}

export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Cores sugeridas no seletor de capinha.
export const CASE_COLOR_PRESETS: string[] = [
  '#111827', '#64748b', '#e6e6e6', '#ffffff', '#ffd6e7', '#ec4899',
  '#ef4444', '#f97316', '#eab308', '#dda25f', '#22c55e', '#14b8a6',
  '#61e7ff', '#3b82f6', '#0008eb', '#8b5cf6',
];
