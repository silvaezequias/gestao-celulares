'use client';

import React from 'react';
import { Pencil, Trash2, Building2 } from 'lucide-react';
import { Phone } from '../../lib/phones/types';
import { PhoneMockup } from './PhoneMockup';
import { findMatchRange } from '../../lib/phones/search';
import { formatPhoneNumber } from '../../lib/phones/format';

interface PhoneCardProps {
  phone: Phone;
  departmentName?: string;
  searchQuery?: string;
  onEdit: () => void;
  onDelete: () => void;
}

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

interface NumberRowProps {
  label: string;
  number: string;
  isNormal: boolean;
  isBusiness: boolean;
  searchQuery?: string;
}

const NumberRow: React.FC<NumberRowProps> = ({ label, number, isNormal, isBusiness, searchQuery }) => (
  <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 pl-2.5 pr-2 py-1.5">
    <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0 w-9 truncate">{label}</span>
    <span className="text-sm font-bold text-slate-900 font-mono tracking-tight flex-1 min-w-0 whitespace-nowrap">
      {renderHighlighted(formatPhoneNumber(number), searchQuery)}
    </span>
    {(isNormal || isBusiness) && (
      <div className="flex gap-1 shrink-0">
        {isNormal && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold whitespace-nowrap">
            WhatsApp
          </span>
        )}
        {isBusiness && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold whitespace-nowrap">
            Business
          </span>
        )}
      </div>
    )}
  </div>
);

export const PhoneCard: React.FC<PhoneCardProps> = ({ phone, departmentName, searchQuery, onEdit, onDelete }) => {
  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
          aria-label="Editar"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          aria-label="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex gap-1 shrink-0">
          <PhoneMockup
            model={phone.model}
            seedKey={`${phone.name}-${phone.model}`}
            caseColor={phone.caseColor}
            view="front"
            size={52}
          />
          <PhoneMockup
            model={phone.model}
            seedKey={`${phone.name}-${phone.model}`}
            caseColor={phone.caseColor}
            view="back"
            size={52}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 text-sm truncate">{phone.name}</h3>
          <p className="text-xs text-slate-400 truncate">{phone.model}</p>
          {departmentName && (
            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium">
              <Building2 className="w-2.5 h-2.5" />
              {departmentName}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {phone.chips
          .filter((c) => c.number.trim())
          .map((chip) => (
            <NumberRow
              key={chip.id}
              label={chip.label}
              number={chip.number}
              isNormal={phone.whatsapp.normal === chip.id}
              isBusiness={phone.whatsapp.business === chip.id}
              searchQuery={searchQuery}
            />
          ))}
        {phone.extraNumbers
          .filter((e) => e.number.trim())
          .map((extra) => (
            <NumberRow
              key={extra.id}
              label={extra.label || 'Extra'}
              number={extra.number}
              isNormal={phone.whatsapp.normal === extra.id}
              isBusiness={phone.whatsapp.business === extra.id}
              searchQuery={searchQuery}
            />
          ))}
      </div>
    </div>
  );
};
