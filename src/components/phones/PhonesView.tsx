'use client';

import React, { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { Plus, Search, Settings2, Smartphone } from 'lucide-react';
import { useStore } from '../../lib/phones/store';
import { Phone } from '../../lib/phones/types';
import { numberMatchesQuery } from '../../lib/phones/search';
import { PhoneCard } from './PhoneCard';
import { PhoneDetailSheet } from './PhoneDetailSheet';
import { PhoneFormSheet } from './PhoneFormSheet';
import { DepartmentsSheet } from './DepartmentsSheet';
import { EmptyState, SearchField } from '../ui/bits';

const ALL = '__all__';
const NONE = '__none__';

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function PhonesView() {
  const { phones, departments, departmentById } = useStore();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [filter, setFilter] = useState(ALL);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Phone | 'new' | null>(null);
  const [managing, setManaging] = useState(false);

  const deptKey = useCallback(
    (p: Phone) => (p.departmentId && departmentById.has(p.departmentId) ? p.departmentId : NONE),
    [departmentById]
  );

  const searched = useMemo(() => {
    const q = deferredQuery.trim();
    if (!q) return phones;
    const text = normalizeText(q);
    return phones.filter(
      (p) =>
        p.chips.some((c) => numberMatchesQuery(c.number, q)) ||
        p.extraNumbers.some((e) => numberMatchesQuery(e.number, q)) ||
        normalizeText(p.name).includes(text) ||
        normalizeText(p.model).includes(text) ||
        normalizeText(departmentById.get(p.departmentId ?? '')?.name ?? '').includes(text)
    );
  }, [phones, deferredQuery, departmentById]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    searched.forEach((p) => map.set(deptKey(p), (map.get(deptKey(p)) ?? 0) + 1));
    return map;
  }, [searched, deptKey]);

  // Lista única (sem seções por departamento — a maioria tem poucos
  // aparelhos e as seções deixavam a tela cheia de espaços vazios). O
  // departamento aparece no próprio card e a ordem agrupa por ele.
  const visible = useMemo(() => {
    const deptName = (p: Phone) => departmentById.get(p.departmentId ?? '')?.name ?? '￿';
    return searched
      .filter((p) => filter === ALL || deptKey(p) === filter)
      .sort((a, b) => deptName(a).localeCompare(deptName(b), 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR'));
  }, [searched, filter, deptKey, departmentById]);

  const totalChips = useMemo(() => phones.reduce((n, p) => n + p.chips.filter((c) => c.number.trim()).length, 0), [phones]);
  const openPhone = openId ? phones.find((p) => p.id === openId) ?? null : null;
  const onOpen = useCallback((p: Phone) => setOpenId(p.id), []);

  const filterChip = (key: string, label: string, count?: number) => {
    const active = filter === key;
    return (
      <button
        key={key}
        onClick={() => setFilter(active && key !== ALL ? ALL : key)}
        className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition ${
          active ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50'
        }`}
      >
        {label}
        {count !== undefined && (
          <span className={`tabular-nums ${active ? 'text-white/60' : 'text-zinc-400'}`}>{count}</span>
        )}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-zinc-900 sm:text-3xl">Aparelhos</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {phones.length} {phones.length === 1 ? 'celular' : 'celulares'} · {totalChips} chips · {departments.length} departamentos
          </p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary hidden md:inline-flex">
          <Plus className="h-4 w-4" />
          Novo celular
        </button>
      </div>

      <div className="mt-5">
        <SearchField value={query} onChange={setQuery} placeholder="Buscar número (ex: 4565), nome ou modelo" />
      </div>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {filterChip(ALL, 'Todos', searched.length)}
        {departments.map((d) => filterChip(d.id, d.name, counts.get(d.id) ?? 0))}
        {(counts.get(NONE) ?? 0) > 0 && filterChip(NONE, 'Sem departamento', counts.get(NONE))}
        <button
          onClick={() => setManaging(true)}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-zinc-500 border border-dashed border-zinc-300 transition hover:bg-white hover:text-zinc-800"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Departamentos
        </button>
      </div>

      <div className="mt-6 space-y-8">
        {phones.length === 0 ? (
          <EmptyState icon={Smartphone} title="Nenhum celular cadastrado ainda">
            <button onClick={() => setEditing('new')} className="btn-primary mt-4">
              <Plus className="h-4 w-4" /> Cadastrar o primeiro
            </button>
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState icon={Search} title="Nada encontrado">
            {deferredQuery ? <>Nenhum celular corresponde a “{deferredQuery}”.</> : 'Nenhum celular neste departamento.'}
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <PhoneCard
                key={p.id}
                phone={p}
                departmentName={departmentById.get(p.departmentId ?? '')?.name}
                query={deferredQuery}
                onOpen={onOpen}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botão flutuante (mobile) */}
      <button
        onClick={() => setEditing('new')}
        className="app-chrome fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-4 z-20 grid h-14 w-14 place-items-center rounded-2xl bg-zinc-900 text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] transition active:scale-95 md:hidden"
        aria-label="Novo celular"
      >
        <Plus className="h-6 w-6" />
      </button>

      {openPhone && (
        <PhoneDetailSheet
          phone={openPhone}
          onClose={() => setOpenId(null)}
          onEdit={() => {
            setEditing(openPhone);
            setOpenId(null);
          }}
        />
      )}
      {editing && (
        <PhoneFormSheet
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? undefined : editing}
          defaultDepartmentId={filter !== ALL && filter !== NONE ? filter : undefined}
          onClose={() => setEditing(null)}
          onSaved={(p) => {
            setEditing(null);
            setOpenId(p.id);
          }}
        />
      )}
      {managing && <DepartmentsSheet onClose={() => setManaging(false)} />}
    </div>
  );
}
