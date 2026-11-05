'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Department, NumberRecord, NumberRecordDraft, Phone, PhoneDraft } from './types';

// Estado global do app no cliente. Os dados iniciais já chegam prontos do
// servidor (renderizados no HTML), então não existe mais a espera de um
// fetch depois que a página abre. As alterações vão pra API e atualizam
// esse estado — todas as telas enxergam a mudança na hora.

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Falha ao salvar (${res.status})`);
  }
  return res.json();
}

interface Toast {
  id: number;
  message: string;
  tone: 'ok' | 'error';
}

interface StoreValue {
  phones: Phone[];
  departments: Department[];
  numbers: NumberRecord[];
  addNumber: (draft: NumberRecordDraft) => Promise<NumberRecord>;
  updateNumber: (id: string, draft: NumberRecordDraft) => Promise<NumberRecord>;
  removeNumber: (id: string) => Promise<void>;
  departmentById: Map<string, Department>;
  addPhone: (draft: PhoneDraft) => Promise<Phone>;
  updatePhone: (id: string, draft: PhoneDraft) => Promise<Phone>;
  removePhone: (id: string) => Promise<void>;
  addDepartment: (name: string) => Promise<Department | null>;
  renameDepartment: (id: string, name: string) => Promise<void>;
  removeDepartment: (id: string) => Promise<void>;
  toasts: Toast[];
  notify: (message: string, tone?: Toast['tone']) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({
  initialPhones,
  initialDepartments,
  initialNumbers,
  children,
}: {
  initialPhones: Phone[];
  initialDepartments: Department[];
  initialNumbers: NumberRecord[];
  children: React.ReactNode;
}) {
  const [phones, setPhones] = useState(initialPhones);
  const [departments, setDepartments] = useState(initialDepartments);
  const [numbers, setNumbers] = useState(initialNumbers);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2800);
  }, []);

  const departmentById = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments]);

  const guard = useCallback(
    async <T,>(fn: () => Promise<T>, success?: string): Promise<T> => {
      try {
        const result = await fn();
        if (success) notify(success);
        return result;
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Algo deu errado', 'error');
        throw err;
      }
    },
    [notify]
  );

  const addPhone = useCallback(
    (draft: PhoneDraft) =>
      guard(async () => {
        const phone = await api<Phone>('/api/phones', { method: 'POST', body: JSON.stringify(draft) });
        setPhones((prev) => [...prev, phone]);
        return phone;
      }, 'Celular cadastrado'),
    [guard]
  );

  const updatePhone = useCallback(
    (id: string, draft: PhoneDraft) =>
      guard(async () => {
        const phone = await api<Phone>(`/api/phones/${id}`, { method: 'PUT', body: JSON.stringify(draft) });
        setPhones((prev) => prev.map((p) => (p.id === id ? phone : p)));
        return phone;
      }, 'Alterações salvas'),
    [guard]
  );

  const removePhone = useCallback(
    (id: string) =>
      guard(async () => {
        await api(`/api/phones/${id}`, { method: 'DELETE' });
        setPhones((prev) => prev.filter((p) => p.id !== id));
      }, 'Celular excluído'),
    [guard]
  );

  const addDepartment = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const existing = departments.find((d) => d.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) return existing;
      return guard(async () => {
        const created = await api<Department>('/api/departments', {
          method: 'POST',
          body: JSON.stringify({ name: trimmed }),
        });
        setDepartments((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        return created;
      }, 'Departamento criado');
    },
    [departments, guard]
  );

  const renameDepartment = useCallback(
    (id: string, name: string) =>
      guard(async () => {
        const updated = await api<Department>(`/api/departments/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name }),
        });
        setDepartments((prev) => prev.map((d) => (d.id === id ? updated : d)));
      }, 'Departamento renomeado'),
    [guard]
  );

  const removeDepartment = useCallback(
    (id: string) =>
      guard(async () => {
        await api(`/api/departments/${id}`, { method: 'DELETE' });
        setDepartments((prev) => prev.filter((d) => d.id !== id));
      }, 'Departamento excluído'),
    [guard]
  );

  const addNumber = useCallback(
    (draft: NumberRecordDraft) =>
      guard(async () => {
        const rec = await api<NumberRecord>('/api/numbers', { method: 'POST', body: JSON.stringify(draft) });
        setNumbers((prev) => [...prev, rec]);
        return rec;
      }, 'Número cadastrado'),
    [guard]
  );

  const updateNumber = useCallback(
    (id: string, draft: NumberRecordDraft) =>
      guard(async () => {
        const rec = await api<NumberRecord>(`/api/numbers/${id}`, { method: 'PUT', body: JSON.stringify(draft) });
        setNumbers((prev) => prev.map((n) => (n.id === id ? rec : n)));
        return rec;
      }, 'Número atualizado'),
    [guard]
  );

  const removeNumber = useCallback(
    (id: string) =>
      guard(async () => {
        await api(`/api/numbers/${id}`, { method: 'DELETE' });
        setNumbers((prev) => prev.filter((n) => n.id !== id));
      }, 'Número excluído'),
    [guard]
  );

  const value: StoreValue = {
    phones,
    departments,
    numbers,
    addNumber,
    updateNumber,
    removeNumber,
    departmentById,
    addPhone,
    updatePhone,
    removePhone,
    addDepartment,
    renameDepartment,
    removeDepartment,
    toasts,
    notify,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return ctx;
}
