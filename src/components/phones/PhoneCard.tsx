'use client';

import React, { memo } from 'react';
import { kindInfo, Phone } from '../../lib/phones/types';
import { formatPhoneNumber } from '../../lib/phones/format';
import { lastDigits } from '../../lib/phones/numbers';
import { DevicePair } from '../device/DeviceThumb';
import { Highlight, NumberSource, SourceBadge, WaBadge } from '../ui/bits';

export interface NumberEntry {
  id: string;
  label: string;
  number: string;
  isNormal: boolean;
  isBusiness: boolean;
  source: NumberSource;
  provider?: string;
}

export function phoneNumbers(phone: Phone): NumberEntry[] {
  return [
    ...phone.chips
      .filter((c) => c.number.trim())
      .map((c) => ({ id: c.id, label: c.label || 'Chip', number: c.number, source: 'chip' as NumberSource })),
    ...phone.extraNumbers
      .filter((e) => e.number.trim())
      .map((e) => ({
        id: e.id,
        label: e.label || kindInfo(e.kind).short,
        number: e.number,
        source: (e.kind ?? 'whatsapp') as NumberSource,
        provider: e.provider,
      })),
  ].map((n) => ({ ...n, isNormal: phone.whatsapp.normal === n.id, isBusiness: phone.whatsapp.business === n.id }));
}

export const PhoneCard = memo(function PhoneCard({
  phone,
  departmentName,
  query,
  onOpen,
}: {
  phone: Phone;
  departmentName?: string;
  query?: string;
  onOpen: (phone: Phone) => void;
}) {
  const numbers = phoneNumbers(phone);

  return (
    <button
      onClick={() => onOpen(phone)}
      className="group flex w-full gap-3.5 rounded-[20px] bg-white p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-zinc-200/70 transition hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] hover:ring-zinc-300 active:scale-[0.99]"
    >
      <div className="grid w-[76px] shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-zinc-50 to-zinc-100/80 py-2.5 ring-1 ring-inset ring-zinc-100">
        <DevicePair model={phone.model} seed={`${phone.name}-${phone.model}`} caseColor={phone.caseColor} width={34} />
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate text-[15px] font-semibold tracking-tight text-zinc-900">
          {phone.name}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {phone.model || 'Modelo não informado'}
          {departmentName && <span className="text-zinc-400"> · {departmentName}</span>}
          {phone.chips.every((c) => !c.number.trim()) && numbers.length > 0 && (
            <span className="text-zinc-400"> · sem chip</span>
          )}
        </p>

        <div className="mt-2.5 space-y-1">
          {numbers.length === 0 && <p className="text-xs italic text-zinc-400">Sem números</p>}
          {numbers.map((n) => (
            <div key={n.id} className="flex min-w-0 items-center gap-2">
              <span className="w-11 min-w-0 shrink truncate text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                {n.label}
              </span>
              <span
                className="shrink-0 font-mono text-[13.5px] font-semibold tracking-tight text-zinc-800"
                title={formatPhoneNumber(n.number)}
              >
                <span className="text-zinc-300">••</span>
                <Highlight text={lastDigits(n.number)} query={query} />
              </span>
              <span className="ml-auto flex min-w-0 shrink justify-end gap-1 overflow-hidden">
                {n.source !== 'chip' && <SourceBadge source={n.source} />}
                {n.isNormal && <WaBadge kind="normal" />}
                {n.isBusiness && <WaBadge kind="business" />}
              </span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
});
