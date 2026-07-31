'use client';

import { useCallback, useEffect, useState } from 'react';
import { Department, Phone, PhoneDraft } from './types';

// Chaves antigas do localStorage — usadas só pra migrar os dados que já
// existiam no navegador do usuário pro banco, na primeira carga depois do
// deploy com Mongo/Prisma.
const LEGACY_PHONES_KEY = 'gestao-celulares:v1';
const LEGACY_DEPARTMENTS_KEY = 'gestao-celulares:departments:v1';

function loadLegacy<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    throw new Error(`Falha na requisição para ${url}: ${res.status}`);
  }
  return res.json();
}

// Migração única: se o banco ainda não tem nada e existem dados salvos no
// localStorage de uma sessão anterior (antes do backend existir), envia tudo
// pra API e limpa o localStorage.
async function migrateLegacyData(): Promise<{ phones: Phone[]; departments: Department[] } | null> {
  const legacyPhones = loadLegacy<Phone>(LEGACY_PHONES_KEY);
  const legacyDepartments = loadLegacy<Department>(LEGACY_DEPARTMENTS_KEY);
  if (legacyPhones.length === 0 && legacyDepartments.length === 0) return null;

  // Remove já aqui, antes de qualquer await: em dev o React StrictMode
  // roda o efeito duas vezes, e sem isso a segunda chamada concorrente
  // veria o localStorage ainda preenchido e duplicaria tudo no banco.
  window.localStorage.removeItem(LEGACY_PHONES_KEY);
  window.localStorage.removeItem(LEGACY_DEPARTMENTS_KEY);

  const departmentIdMap = new Map<string, string>();
  const createdDepartments: Department[] = [];
  for (const dept of legacyDepartments) {
    const created = await api<Department>('/api/departments', {
      method: 'POST',
      body: JSON.stringify({ name: dept.name }),
    });
    departmentIdMap.set(dept.id, created.id);
    createdDepartments.push(created);
  }

  const createdPhones: Phone[] = [];
  for (const phone of legacyPhones) {
    const draft: PhoneDraft = {
      name: phone.name,
      model: phone.model,
      chips: phone.chips,
      extraNumbers: phone.extraNumbers ?? [],
      whatsapp: phone.whatsapp,
      caseColor: phone.caseColor,
      departmentId: phone.departmentId ? departmentIdMap.get(phone.departmentId) : undefined,
    };
    const created = await api<Phone>('/api/phones', { method: 'POST', body: JSON.stringify(draft) });
    createdPhones.push(created);
  }

  return { phones: createdPhones, departments: createdDepartments };
}

export function usePhones() {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const migrated = await migrateLegacyData().catch(() => null);
      if (migrated) {
        setPhones(migrated.phones);
        setDepartments(migrated.departments);
      } else {
        const [fetchedPhones, fetchedDepartments] = await Promise.all([
          api<Phone[]>('/api/phones'),
          api<Department[]>('/api/departments'),
        ]);
        setPhones(fetchedPhones);
        setDepartments(fetchedDepartments);
      }
      setLoaded(true);
    })();
  }, []);

  const addPhone = useCallback(async (draft: PhoneDraft) => {
    const phone = await api<Phone>('/api/phones', { method: 'POST', body: JSON.stringify(draft) });
    setPhones((prev) => [...prev, phone]);
    return phone;
  }, []);

  const updatePhone = useCallback(async (id: string, draft: PhoneDraft) => {
    const phone = await api<Phone>(`/api/phones/${id}`, { method: 'PUT', body: JSON.stringify(draft) });
    setPhones((prev) => prev.map((p) => (p.id === id ? phone : p)));
  }, []);

  const removePhone = useCallback(async (id: string) => {
    await api(`/api/phones/${id}`, { method: 'DELETE' });
    setPhones((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addDepartment = useCallback(
    async (name: string): Promise<Department | null> => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const existing = departments.find((d) => d.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) return existing;
      const created = await api<Department>('/api/departments', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed }),
      });
      setDepartments((prev) => [...prev, created]);
      return created;
    },
    [departments]
  );

  const removeDepartment = useCallback(async (id: string) => {
    await api(`/api/departments/${id}`, { method: 'DELETE' });
    setDepartments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return {
    phones,
    departments,
    loaded,
    addPhone,
    updatePhone,
    removePhone,
    addDepartment,
    removeDepartment,
  };
}
