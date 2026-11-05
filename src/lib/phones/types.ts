export interface PhoneChip {
  id: string;
  label: string;
  number: string;
  carrier?: string;
}

// Número adicional do celular que não está em nenhum chip físico — existe só
// pra poder ser escolhido como número do WhatsApp Normal/Business.
export interface ExtraNumber {
  id: string;
  label: string;
  number: string;
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
