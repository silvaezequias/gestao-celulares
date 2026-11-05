'use client';

import React, { useDeferredValue, useMemo, useState } from 'react';
import { ArrowLeftRight, CardSim, Search } from 'lucide-react';
import { useStore } from '../../lib/phones/store';
import { numberMatchesQuery } from '../../lib/phones/search';
import { formatPhoneNumber } from '../../lib/phones/format';
import { buildNumberIndex, ChipEntry, findOtherOccurrences, listAllChips } from '../../lib/phones/crossref';
import { DeviceThumb } from '../device/DeviceThumb';
import { EmptyState, Highlight, SearchField, WaBadge } from '../ui/bits';
import { Sheet } from '../ui/Sheet';
import { CopyButton } from './PhoneDetailSheet';

type Filter = 'all' | 'wa' | 'none' | 'dup';

function SimIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 40" className={className} aria-hidden>
      <path d="M6 1h15l10 10v23a5 5 0 0 1-5 5H6a5 5 0 0 1-5-5V6a5 5 0 0 1 5-5Z" fill="#f4f4f5" stroke="#d4d4d8" />
      <rect x="7" y="15" width="18" height="15" rx="3" fill="#e2c46d" />
      <path d="M13 15v15M19 15v15M7 22.5h18" stroke="#b8952f" strokeWidth="0.9" />
    </svg>
  );
}

export function ChipsView() {
  const { phones, departmentById } = useStore();
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<ChipEntry | null>(null);

  const index = useMemo(() => buildNumberIndex(phones), [phones]);
  const all = useMemo(
    () =>
      listAllChips(phones)
        .map((e) => ({ ...e, others: findOtherOccurrences(index, e.chip.number, e.chip.id) }))
        .sort((a, b) => a.phone.name.localeCompare(b.phone.name, 'pt-BR')),
    [phones, index]
  );

  const list = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    return all.filter((e) => {
      if (filter === 'wa' && !e.isNormal && !e.isBusiness) return false;
      if (filter === 'none' && (e.isNormal || e.isBusiness)) return false;
      if (filter === 'dup' && e.others.length === 0) return false;
      if (!q) return true;
      return numberMatchesQuery(e.chip.number, q) || e.phone.name.toLowerCase().includes(q);
    });
  }, [all, deferred, filter]);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: all.length },
    { key: 'wa', label: 'Com WhatsApp', count: all.filter((e) => e.isNormal || e.isBusiness).length },
    { key: 'none', label: 'Sem WhatsApp', count: all.filter((e) => !e.isNormal && !e.isBusiness).length },
    { key: 'dup', label: 'Em mais de um', count: all.filter((e) => e.others.length > 0).length },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
      <h1 className="text-[26px] font-semibold tracking-tight text-zinc-900 sm:text-3xl">Chips</h1>
      <p className="mt-0.5 text-sm text-zinc-500">Todos os chips físicos e onde cada número aparece.</p>

      <div className="mt-5">
        <SearchField value={query} onChange={setQuery} placeholder="Buscar número ou nome do celular" />
      </div>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition ${
              filter === f.key ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {f.label}
            <span className={filter === f.key ? 'text-white/60' : 'text-zinc-400'}>{f.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {all.length === 0 ? (
          <EmptyState icon={CardSim} title="Nenhum chip cadastrado ainda" />
        ) : list.length === 0 ? (
          <EmptyState icon={Search} title="Nada encontrado" />
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((e) => (
              <button
                key={`${e.phone.id}-${e.chip.id}`}
                onClick={() => setSelected(e)}
                className="flex items-center gap-3.5 rounded-[20px] bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-zinc-200/70 transition hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] hover:ring-zinc-300 active:scale-[0.99]"
              >
                <SimIcon className="h-10 w-8 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[17px] font-semibold tracking-tight text-zinc-900">
                    <Highlight text={formatPhoneNumber(e.chip.number)} query={deferred} />
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                    <DeviceThumb model={e.phone.model} seed={`${e.phone.name}-${e.phone.model}`} caseColor={e.phone.caseColor} width={8} />
                    <span className="truncate">{e.phone.name}</span>
                    <span className="shrink-0 text-zinc-300">·</span>
                    <span className="shrink-0 text-zinc-400">{e.chip.label}</span>
                  </div>
                  {(e.isNormal || e.isBusiness || e.others.length > 0) && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {e.isNormal && <WaBadge kind="normal" />}
                      {e.isBusiness && <WaBadge kind="business" />}
                      {e.others.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-px text-[10px] font-semibold text-amber-700 ring-1 ring-amber-600/15">
                          <ArrowLeftRight className="h-2.5 w-2.5" /> Em outro celular
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <Sheet title="Chip" onClose={() => setSelected(null)}>
          {(() => {
            const { phone, chip, isNormal, isBusiness } = selected;
            const others = findOtherOccurrences(index, chip.number, chip.id);
            const dept = phone.departmentId ? departmentById.get(phone.departmentId)?.name : undefined;
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-100">
                  <SimIcon className="h-12 w-10 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{chip.label}</p>
                    <p className="font-mono text-xl font-semibold tracking-tight">{formatPhoneNumber(chip.number)}</p>
                    <div className="mt-1 flex gap-1">
                      {isNormal && <WaBadge kind="normal" size="md" />}
                      {isBusiness && <WaBadge kind="business" size="md" />}
                      {!isNormal && !isBusiness && <span className="text-xs text-zinc-400">Sem WhatsApp neste aparelho</span>}
                    </div>
                  </div>
                  <CopyButton value={chip.number.replace(/\D/g, '')} />
                </div>

                <div>
                  <p className="label">Está no aparelho</p>
                  <div className="flex items-center gap-3 rounded-2xl p-3 ring-1 ring-zinc-200/70">
                    <DeviceThumb model={phone.model} seed={`${phone.name}-${phone.model}`} caseColor={phone.caseColor} width={26} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{phone.name}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {phone.model}
                        {dept && ` · ${dept}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="label">Também aparece em</p>
                  {others.length === 0 ? (
                    <p className="text-sm text-zinc-400">Nenhum outro aparelho.</p>
                  ) : (
                    <div className="space-y-2">
                      {others.map((o) => (
                        <div key={`${o.phone.id}-${o.sourceId}`} className="flex items-center gap-3 rounded-2xl p-3 ring-1 ring-amber-200 bg-amber-50/40">
                          <DeviceThumb model={o.phone.model} seed={`${o.phone.name}-${o.phone.model}`} caseColor={o.phone.caseColor} width={20} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{o.phone.name}</p>
                            <p className="truncate text-xs text-zinc-500">{o.sourceType === 'chip' ? o.label : `Número extra (${o.label})`}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {o.isNormal && <WaBadge kind="normal" />}
                            {o.isBusiness && <WaBadge kind="business" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </Sheet>
      )}
    </div>
  );
}
