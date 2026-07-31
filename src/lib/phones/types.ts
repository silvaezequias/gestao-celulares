export type ChipId = string;

export interface PhoneChip {
  id: ChipId;
  label: string;
  number: string;
  carrier?: string;
}

// Número adicional do celular que não está em nenhum chip físico — existe só
// pra poder ser escolhido como número do WhatsApp Normal/Business, já que
// esses apps podem estar logados num número diferente do(s) chip(s).
export interface ExtraNumber {
  id: string;
  label: string;
  number: string;
}

// Referencia o id de um PhoneChip OU de um ExtraNumber — o pool de números
// selecionáveis pro WhatsApp é a união dos dois.
export interface WhatsAppAssignments {
  normal?: string;
  business?: string;
}

export interface Phone {
  id: string;
  name: string;
  model: string;
  chips: PhoneChip[];
  extraNumbers: ExtraNumber[];
  whatsapp: WhatsAppAssignments;
  caseColor?: string;
  departmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type PhoneDraft = Omit<Phone, 'id' | 'createdAt' | 'updatedAt'>;

export interface Department {
  id: string;
  name: string;
}

export type PhoneBrand = 'apple' | 'xiaomi' | 'lg' | 'android';

export function detectBrand(model: string): PhoneBrand {
  if (/iphone/i.test(model)) return 'apple';
  if (/xiaomi|redmi|poco/i.test(model)) return 'xiaomi';
  if (/\blg\b/i.test(model)) return 'lg';
  return 'android';
}
