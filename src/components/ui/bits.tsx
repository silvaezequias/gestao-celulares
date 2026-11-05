'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { findMatchRange } from '../../lib/phones/search';

export function Highlight({ text, query }: { text: string; query?: string }) {
  const range = query ? findMatchRange(text, query) : null;
  if (!range) return <>{text}</>;
  const [start, end] = range;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-[4px] bg-amber-200/80 px-0.5 text-zinc-900">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

export function WaBadge({ kind, size = 'sm' }: { kind: 'normal' | 'business'; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'px-2 py-0.5 text-[11px]' : 'px-1.5 py-px text-[10px]';
  return kind === 'normal' ? (
    <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 font-semibold text-emerald-700 ring-1 ring-emerald-600/15 ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      WhatsApp
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1 rounded-full bg-teal-50 font-semibold text-teal-700 ring-1 ring-teal-600/15 ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
      Business
    </span>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400" />
      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-11 text-[16px] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-4 focus:ring-zinc-900/5 sm:text-[15px] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200"
          aria-label="Limpar busca"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-200 px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-zinc-400 shadow-sm ring-1 ring-zinc-100">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-medium text-zinc-700">{title}</p>
      {children && <div className="mt-1 text-sm text-zinc-400">{children}</div>}
    </div>
  );
}
