import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import type { Department, NumberRecord, NumberRecordDraft, Phone, PhoneDraft } from '../phones/types';

// Camada de acesso a dados. Em produção usa o MongoDB via Prisma (variável
// DATABASE_URL configurada na Vercel). Sem DATABASE_URL — ou seja, rodando
// localmente sem acesso ao banco — usa um arquivo JSON em .data/dev-db.json,
// só pra conseguir desenvolver a interface com dados de verdade.

export const DATA_TAG = 'app-data';

export interface AppData {
  phones: Phone[];
  departments: Department[];
  numbers: NumberRecord[];
}

const useDatabase = !!process.env.DATABASE_URL;

// ---------- Normalização (null do Mongo -> undefined, datas -> ISO) ----------

/* eslint-disable @typescript-eslint/no-explicit-any */
function toPhone(raw: any): Phone {
  return {
    id: raw.id,
    name: raw.name ?? '',
    model: raw.model ?? '',
    chips: (raw.chips ?? []).map((c: any) => ({
      id: c.id,
      label: c.label ?? '',
      number: c.number ?? '',
      ...(c.carrier ? { carrier: c.carrier } : {}),
    })),
    extraNumbers: (raw.extraNumbers ?? []).map((e: any) => ({
      id: e.id,
      label: e.label ?? '',
      number: e.number ?? '',
      kind: e.kind === 'api' || e.kind === 'esim' ? e.kind : 'whatsapp',
      ...(e.provider ? { provider: e.provider } : {}),
    })),
    whatsapp: {
      ...(raw.whatsapp?.normal ? { normal: raw.whatsapp.normal } : {}),
      ...(raw.whatsapp?.business ? { business: raw.whatsapp.business } : {}),
    },
    ...(raw.caseColor ? { caseColor: raw.caseColor } : {}),
    ...(raw.departmentId ? { departmentId: raw.departmentId } : {}),
    createdAt: new Date(raw.createdAt).toISOString(),
    updatedAt: new Date(raw.updatedAt).toISOString(),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function draftData(draft: PhoneDraft) {
  return {
    name: draft.name,
    model: draft.model,
    chips: draft.chips,
    extraNumbers: draft.extraNumbers.map((e) => ({
      id: e.id,
      label: e.label,
      number: e.number,
      kind: e.kind ?? 'whatsapp',
      provider: e.kind === 'api' && e.provider ? e.provider : null,
    })),
    whatsapp: { normal: draft.whatsapp.normal ?? null, business: draft.whatsapp.business ?? null },
    caseColor: draft.caseColor ?? null,
    departmentId: draft.departmentId ?? null,
  };
}

// ---------- Banco local de desenvolvimento ----------

const DEV_FILE = path.join(process.cwd(), '.data', 'dev-db.json');

async function readDev(): Promise<AppData> {
  try {
    return JSON.parse(await fs.readFile(DEV_FILE, 'utf8'));
  } catch {
    return { phones: [], departments: [], numbers: [] };
  }
}

async function writeDev(data: AppData) {
  await fs.mkdir(path.dirname(DEV_FILE), { recursive: true });
  await fs.writeFile(DEV_FILE, JSON.stringify(data, null, 1));
}

function newObjectId(): string {
  const hex = '0123456789abcdef';
  let id = Math.floor(Date.now() / 1000).toString(16);
  while (id.length < 24) id += hex[Math.floor(Math.random() * 16)];
  return id;
}

async function getPrisma() {
  return (await import('../prisma')).prisma;
}

// ---------- Leitura (com cache) ----------

async function loadAll(): Promise<AppData> {
  if (!useDatabase) {
    const data = await readDev();
    return { phones: data.phones.map(toPhone), departments: data.departments, numbers: (data.numbers ?? []).map(toNumber) };
  }
  const prisma = await getPrisma();
  const [phones, departments, numbers] = await Promise.all([
    prisma.phone.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
    prisma.numberRecord.findMany({ orderBy: { createdAt: 'asc' } }),
  ]);
  return {
    phones: phones.map(toPhone),
    departments: departments.map((d) => ({ id: d.id, name: d.name })),
    numbers: numbers.map(toNumber),
  };
}

// O resultado fica em cache no servidor e só é recarregado do banco quando
// algum dado muda (ver invalidate()). Assim abrir o site não depende de
// consultar o Mongo a cada visita.
export const getAppData = unstable_cache(loadAll, ['app-data-v2'], { tags: [DATA_TAG] });

export function invalidate() {
  revalidateTag(DATA_TAG, { expire: 0 });
  revalidatePath('/', 'layout');
}

// ---------- Escrita ----------

export async function createPhone(draft: PhoneDraft): Promise<Phone> {
  if (!useDatabase) {
    const data = await readDev();
    const now = new Date().toISOString();
    const phone = toPhone({ ...draft, id: newObjectId(), createdAt: now, updatedAt: now });
    data.phones.push(phone);
    await writeDev(data);
    return phone;
  }
  const prisma = await getPrisma();
  return toPhone(await prisma.phone.create({ data: draftData(draft) }));
}

export async function updatePhone(id: string, draft: PhoneDraft): Promise<Phone> {
  if (!useDatabase) {
    const data = await readDev();
    const idx = data.phones.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Celular não encontrado');
    const phone = toPhone({ ...data.phones[idx], ...draft, id, updatedAt: new Date().toISOString() });
    data.phones[idx] = phone;
    await writeDev(data);
    return phone;
  }
  const prisma = await getPrisma();
  return toPhone(await prisma.phone.update({ where: { id }, data: draftData(draft) }));
}

export async function deletePhone(id: string) {
  if (!useDatabase) {
    const data = await readDev();
    data.phones = data.phones.filter((p) => p.id !== id);
    await writeDev(data);
    return;
  }
  const prisma = await getPrisma();
  await prisma.phone.delete({ where: { id } });
}

export async function createDepartment(name: string): Promise<Department> {
  if (!useDatabase) {
    const data = await readDev();
    const existing = data.departments.find((d) => d.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const dept = { id: newObjectId(), name };
    data.departments.push(dept);
    await writeDev(data);
    return dept;
  }
  const prisma = await getPrisma();
  const existing = await prisma.department.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });
  if (existing) return { id: existing.id, name: existing.name };
  const created = await prisma.department.create({ data: { name } });
  return { id: created.id, name: created.name };
}

export async function renameDepartment(id: string, name: string): Promise<Department> {
  if (!useDatabase) {
    const data = await readDev();
    const dept = data.departments.find((d) => d.id === id);
    if (!dept) throw new Error('Departamento não encontrado');
    dept.name = name;
    await writeDev(data);
    return dept;
  }
  const prisma = await getPrisma();
  const updated = await prisma.department.update({ where: { id }, data: { name } });
  return { id: updated.id, name: updated.name };
}

export async function deleteDepartment(id: string) {
  if (!useDatabase) {
    const data = await readDev();
    data.departments = data.departments.filter((d) => d.id !== id);
    await writeDev(data);
    return;
  }
  const prisma = await getPrisma();
  await prisma.department.delete({ where: { id } });
}

// ---------- Cadastro de números ----------

/* eslint-disable @typescript-eslint/no-explicit-any */
function toNumber(raw: any): NumberRecord {
  const kinds = ['chip', 'esim', 'api', 'fixo', 'whatsapp'];
  return {
    id: raw.id,
    number: String(raw.number ?? '').replace(/\D/g, ''),
    kind: kinds.includes(raw.kind) ? raw.kind : 'chip',
    ...(raw.carrier ? { carrier: raw.carrier } : {}),
    ...(raw.owner ? { owner: raw.owner } : {}),
    ...(raw.plan === 'pre' || raw.plan === 'pos' ? { plan: raw.plan } : {}),
    ...(raw.notes ? { notes: raw.notes } : {}),
    createdAt: new Date(raw.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(raw.updatedAt ?? Date.now()).toISOString(),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function numberData(draft: NumberRecordDraft) {
  return {
    number: draft.number.replace(/\D/g, ''),
    kind: draft.kind,
    carrier: draft.carrier?.trim() || null,
    owner: draft.owner?.trim() || null,
    plan: draft.plan ?? null,
    notes: draft.notes?.trim() || null,
  };
}

export async function createNumber(draft: NumberRecordDraft): Promise<NumberRecord> {
  if (!useDatabase) {
    const data = await readDev();
    const now = new Date().toISOString();
    const rec = toNumber({ ...numberData(draft), id: newObjectId(), createdAt: now, updatedAt: now });
    data.numbers = [...(data.numbers ?? []), rec];
    await writeDev(data);
    return rec;
  }
  const prisma = await getPrisma();
  return toNumber(await prisma.numberRecord.create({ data: numberData(draft) }));
}

export async function updateNumber(id: string, draft: NumberRecordDraft): Promise<NumberRecord> {
  if (!useDatabase) {
    const data = await readDev();
    const list = data.numbers ?? [];
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error('Número não encontrado');
    const rec = toNumber({ ...list[idx], ...numberData(draft), id, updatedAt: new Date().toISOString() });
    list[idx] = rec;
    data.numbers = list;
    await writeDev(data);
    return rec;
  }
  const prisma = await getPrisma();
  return toNumber(await prisma.numberRecord.update({ where: { id }, data: numberData(draft) }));
}

export async function deleteNumber(id: string) {
  if (!useDatabase) {
    const data = await readDev();
    data.numbers = (data.numbers ?? []).filter((n) => n.id !== id);
    await writeDev(data);
    return;
  }
  const prisma = await getPrisma();
  await prisma.numberRecord.delete({ where: { id } });
}
