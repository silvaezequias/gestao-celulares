'use client';

import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Check, Copy, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '../../lib/phones/store';
import { Phone } from '../../lib/phones/types';
import { formatPhoneNumber } from '../../lib/phones/format';
import { buildNumberIndex, findOtherOccurrences } from '../../lib/phones/crossref';
import { resolveDevice } from '../../lib/phones/devices';
import { DeviceThumb } from '../device/DeviceThumb';
import { ConfirmSheet, Sheet } from '../ui/Sheet';
import { SourceBadge, WaBadge } from '../ui/bits';
import { phoneNumbers } from './PhoneCard';

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          /* sem permissão de área de transferência */
        }
      }}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
      aria-label="Copiar número"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

export function PhoneDetailSheet({ phone, onClose, onEdit }: { phone: Phone; onClose: () => void; onEdit: () => void }) {
  const { phones, departmentById, removePhone } = useStore();
  const [confirming, setConfirming] = useState(false);
  const index = useMemo(() => buildNumberIndex(phones), [phones]);
  const numbers = phoneNumbers(phone);
  const department = phone.departmentId ? departmentById.get(phone.departmentId)?.name : undefined;
  const spec = resolveDevice(phone.model);
  const seed = `${phone.name}-${phone.model}`;

  return (
    <>
      <Sheet
        onClose={onClose}
        title={<span className="text-zinc-400 text-sm font-medium">Detalhes</span>}
        footer={
          <div className="flex gap-2">
            <button onClick={() => setConfirming(true)} className="btn-secondary w-12 px-0 text-red-600" aria-label="Excluir">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onEdit} className="btn-primary flex-1">
              <Pencil className="h-4 w-4" /> Editar
            </button>
          </div>
        }
      >
        <div className="flex items-center justify-center gap-5 rounded-3xl bg-gradient-to-b from-zinc-50 to-zinc-100 py-6 ring-1 ring-inset ring-zinc-100">
          <DeviceThumb model={phone.model} seed={seed} caseColor={phone.caseColor} view="front" width={64} className="drop-shadow-md" />
          <DeviceThumb model={phone.model} seed={seed} caseColor={phone.caseColor} view="back" width={64} className="drop-shadow-lg" />
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">{phone.name}</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {phone.model || 'Modelo não informado'} {phone.model && <span className="text-zinc-400">· {spec.family}</span>}
          </p>
          {department && (
            <span className="mt-2 inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">{department}</span>
          )}
        </div>

        <div className="mt-5 divide-y divide-zinc-100 rounded-2xl ring-1 ring-zinc-200/70">
          {numbers.length === 0 && <p className="p-4 text-sm italic text-zinc-400">Nenhum número cadastrado.</p>}
          {numbers.map((n) => {
            const others = findOtherOccurrences(index, n.number, n.id);
            return (
              <div key={n.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    {n.label}
                  </p>
                  <p className="font-mono text-[17px] font-semibold tracking-tight text-zinc-900">{formatPhoneNumber(n.number)}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <SourceBadge source={n.source} provider={n.provider} size="md" />
                    {n.isNormal && <WaBadge kind="normal" size="md" />}
                    {n.isBusiness && <WaBadge kind="business" size="md" />}
                    {others.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-600/15">
                        <ArrowLeftRight className="h-3 w-3" />
                        Também em {others.map((o) => o.phone.name).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <CopyButton value={n.number.replace(/\D/g, '')} />
              </div>
            );
          })}
        </div>
      </Sheet>

      {confirming && (
        <ConfirmSheet
          title="Excluir celular?"
          message={
            <>
              <strong className="font-semibold text-zinc-800">{phone.name}</strong> será excluído permanentemente.
            </>
          }
          onClose={() => setConfirming(false)}
          onConfirm={async () => {
            await removePhone(phone.id);
            onClose();
          }}
        />
      )}
    </>
  );
}
