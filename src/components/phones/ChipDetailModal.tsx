'use client';

import React from 'react';
import { X, Building2, ArrowLeftRight } from 'lucide-react';
import { Department } from '../../lib/phones/types';
import { ChipEntry, NumberOccurrence, findOtherOccurrences } from '../../lib/phones/crossref';
import { formatPhoneNumber } from '../../lib/phones/format';
import { PhoneMockup } from './PhoneMockup';

interface ChipDetailModalProps {
  entry: ChipEntry;
  index: Map<string, NumberOccurrence[]>;
  departmentById: Map<string, Department>;
  onClose: () => void;
}

function StatusBadge({ isNormal, isBusiness }: { isNormal: boolean; isBusiness: boolean }) {
  if (!isNormal && !isBusiness) {
    return <span className="text-xs text-slate-400 italic">Não está em nenhum WhatsApp</span>;
  }
  return (
    <div className="flex gap-1.5">
      {isNormal && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">
          WhatsApp
        </span>
      )}
      {isBusiness && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[11px] font-bold">
          Business
        </span>
      )}
    </div>
  );
}

export const ChipDetailModal: React.FC<ChipDetailModalProps> = ({ entry, index, departmentById, onClose }) => {
  const { phone, chip, isNormal, isBusiness } = entry;
  const departmentName = phone.departmentId ? departmentById.get(phone.departmentId)?.name : undefined;
  const others = findOtherOccurrences(index, chip.number, chip.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-semibold text-lg text-slate-900">Detalhes do chip</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex gap-4">
            <div className="flex gap-1.5 shrink-0">
              <PhoneMockup
                model={phone.model}
                seedKey={`${phone.name}-${phone.model}`}
                caseColor={phone.caseColor}
                view="front"
                size={68}
              />
              <PhoneMockup
                model={phone.model}
                seedKey={`${phone.name}-${phone.model}`}
                caseColor={phone.caseColor}
                view="back"
                size={68}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-900">{phone.name}</h3>
              <p className="text-xs text-slate-400">{phone.model}</p>
              {departmentName && (
                <span className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium">
                  <Building2 className="w-2.5 h-2.5" />
                  {departmentName}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{chip.label}</p>
            <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">
              {formatPhoneNumber(chip.number)}
            </p>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Nesse celular está usando:
              </p>
              <StatusBadge isNormal={isNormal} isBusiness={isBusiness} />
            </div>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Esse número também aparece em
            </p>

            {others.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Não aparece em nenhum outro celular.</p>
            ) : (
              <div className="space-y-2">
                {others.map((occ) => {
                  const otherDept = occ.phone.departmentId
                    ? departmentById.get(occ.phone.departmentId)?.name
                    : undefined;
                  return (
                    <div
                      key={`${occ.phone.id}-${occ.sourceId}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3"
                    >
                      <PhoneMockup
                        model={occ.phone.model}
                        seedKey={`${occ.phone.name}-${occ.phone.model}`}
                        caseColor={occ.phone.caseColor}
                        view="front"
                        size={40}
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{occ.phone.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {otherDept ? `${otherDept} — ` : ''}
                          {occ.sourceType === 'chip' ? occ.label : `Número extra (${occ.label})`}
                        </p>
                      </div>
                      <StatusBadge isNormal={occ.isNormal} isBusiness={occ.isBusiness} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
