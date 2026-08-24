'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, X, CardSim, ArrowLeftRight, Building2 } from 'lucide-react';
import { usePhones } from '../../lib/phones/storage';
import { Department } from '../../lib/phones/types';
import { numberMatchesQuery, findMatchRange } from '../../lib/phones/search';
import { formatPhoneNumber } from '../../lib/phones/format';
import { buildNumberIndex, listAllChips, findOtherOccurrences, ChipEntry } from '../../lib/phones/crossref';
import { PhoneMockup } from './PhoneMockup';
import { ChipDetailModal } from './ChipDetailModal';

function renderHighlighted(text: string, query?: string) {
  const range = query ? findMatchRange(text, query) : null;
  if (!range) return text;
  const [start, end] = range;
  return (
    <>
      {text.slice(0, start)}
      <mark className="bg-amber-200 text-slate-900 rounded-sm">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

export const ChipsView: React.FC = () => {
  const { phones, departments, loaded } = usePhones();
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<ChipEntry | null>(null);

  const departmentById = useMemo(() => {
    const map = new Map<string, Department>();
    departments.forEach((d) => map.set(d.id, d));
    return map;
  }, [departments]);

  const allChips = useMemo(() => listAllChips(phones), [phones]);
  const numberIndex = useMemo(() => buildNumberIndex(phones), [phones]);

  const filteredChips = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return allChips;
    return allChips.filter(
      (entry) =>
        numberMatchesQuery(entry.chip.number, query) ||
        entry.phone.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [allChips, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl text-slate-900 flex items-center gap-2.5">
            <CardSim className="w-7 h-7 text-blue-600" />
            Chips
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Todos os chips físicos cadastrados, com o cruzamento de onde cada número é usado.
          </p>
        </div>
      </div>

      <div className="relative mt-4 mb-8 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por número ou nome do celular"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Limpar busca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!loaded ? null : allChips.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200">
          <CardSim className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Nenhum chip cadastrado ainda.</p>
        </div>
      ) : filteredChips.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Nenhum chip encontrado para &quot;{searchQuery}&quot;.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredChips.map((entry) => {
            const departmentName = entry.phone.departmentId
              ? departmentById.get(entry.phone.departmentId)?.name
              : undefined;
            const crossRefCount = findOtherOccurrences(numberIndex, entry.chip.number, entry.chip.id).length;

            return (
              <button
                key={`${entry.phone.id}-${entry.chip.id}`}
                onClick={() => setSelected(entry)}
                className="text-left flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer"
              >
                <PhoneMockup
                  model={entry.phone.model}
                  seedKey={`${entry.phone.name}-${entry.phone.model}`}
                  caseColor={entry.phone.caseColor}
                  view="front"
                  size={44}
                  className="shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">{entry.phone.name}</p>
                    {departmentName && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium shrink-0">
                        <Building2 className="w-2.5 h-2.5" />
                        {departmentName}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                    {entry.chip.label}
                  </p>
                  <p className="text-base font-bold text-slate-900 font-mono tracking-tight">
                    {renderHighlighted(formatPhoneNumber(entry.chip.number), searchQuery)}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    {entry.isNormal && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        WhatsApp
                      </span>
                    )}
                    {entry.isBusiness && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold">
                        Business
                      </span>
                    )}
                    {crossRefCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                        <ArrowLeftRight className="w-2.5 h-2.5" />
                        Também em outro celular
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <ChipDetailModal
          entry={selected}
          index={numberIndex}
          departmentById={departmentById}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};
