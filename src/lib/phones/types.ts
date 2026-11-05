export interface PhoneChip {
  id: string;
  label: string;
  number: string;
  carrier?: string;
}

// Tipos de número que não são um chip físico do aparelho.
export type NumberKind = 'whatsapp' | 'api' | 'esim' | 'fixo';

export const NUMBER_KINDS: { kind: NumberKind; label: string; short: string; hint: string }[] = [
  {
    kind: 'whatsapp',
    label: 'WhatsApp sem chip',
    short: 'Sem chip',
    hint: 'O WhatsApp está logado neste aparelho, mas o chip do número não está nele.',
  },
  {
    kind: 'api',
    label: 'WhatsApp API',
    short: 'API',
    hint: 'Número de WhatsApp API (Cloud API, Z-API, outro provedor). Não existe em chip.',
  },
  { kind: 'esim', label: 'eSIM', short: 'eSIM', hint: 'Chip virtual instalado no próprio aparelho.' },
  { kind: 'fixo', label: 'Fixo', short: 'Fixo', hint: 'Número de telefone fixo (ex.: usado no WhatsApp Business).' },
];

export function kindInfo(kind?: NumberKind) {
  return NUMBER_KINDS.find((k) => k.kind === kind) ?? NUMBER_KINDS[0];
}

// Número do celular que não é um chip físico: WhatsApp sem chip, número de
// API ou eSIM. Também pode ser escolhido como WhatsApp Normal/Business.
export interface ExtraNumber {
  id: string;
  label: string;
  number: string;
  kind?: NumberKind;
  /** provedor do número de API (ex.: Meta Cloud API, Z-API) */
  provider?: string;
}

// Referencia o id de um PhoneChip OU de um ExtraNumber.
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

// Cadastro geral de números (aba Números), independente de estarem num
// celular. Ligado aos aparelhos pelos dígitos.
export type RecordKind = 'chip' | NumberKind;

export interface NumberRecord {
  id: string;
  /** só dígitos, com DDD */
  number: string;
  kind: RecordKind;
  carrier?: string;
  owner?: string;
  plan?: 'pre' | 'pos';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type NumberRecordDraft = Omit<NumberRecord, 'id' | 'createdAt' | 'updatedAt'>;

