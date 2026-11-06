'use client';

import React, { useDeferredValue, useMemo, useState } from 'react';
import { Hash, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useStore } from '../../lib/phones/store';
import { kindInfo, NumberRecord, NumberRecordDraft, RecordKind, NUMBER_KINDS } from '../../lib/phones/types';
import { numberMatchesQuery } from '../../lib/phones/search';
import { formatPhoneNumber, maskPhoneNumber } from '../../lib/phones/format';
import { buildRows, NumberRow } from '../../lib/phones/numbers';
import { DeviceThumb } from '../device/DeviceThumb';
import { EmptyState, Highlight, KIND_ICONS, SearchField, SourceBadge, WaBadge } from '../ui/bits';
import { ConfirmSheet, Sheet } from '../ui/Sheet';
import { CopyButton } from '../phones/PhoneDetailSheet';

const KINDS: { kind: RecordKind; label: string }[] = [
  { kind: 'chip', label: 'Chip' },
  ...NUMBER_KINDS.map((k) => ({ kind: k.kind as RecordKind, label: k.label })),
];

const kindLabel = (k: RecordKind) => (k === 'chip' ? 'Chip' : kindInfo(k).label);

type StatusFilter = 'all' | 'no-wa' | 'no-wb' | 'no-both' | 'nophone' | 'unregistered';

const usedAsWa = (r: NumberRow) => r.usages.some((u) => u.isNormal);
const usedAsWb = (r: NumberRow) => r.usages.some((u) => u.isBusiness);

function matchesStatus(r: NumberRow, s: StatusFilter) {
  switch (s) {
    case 'no-wa':
      return !usedAsWa(r);
    case 'no-wb':
      return !usedAsWb(r);
    case 'no-both':
      return !usedAsWa(r) && !usedAsWb(r);
    case 'nophone':
      return r.usages.length === 0;
    case 'unregistered':
      return !r.record;
    default:
      return true;
  }
}

// ---------- Peças visuais ----------

function SimIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 40" className={className} aria-hidden>
      <path d="M6 1h15l10 10v23a5 5 0 0 1-5 5H6a5 5 0 0 1-5-5V6a5 5 0 0 1 5-5Z" fill="#f4f4f5" stroke="#d4d4d8" />
      <rect x="7" y="15" width="18" height="15" rx="3" fill="#e2c46d" />
      <path d="M13 15v15M19 15v15M7 22.5h18" stroke="#b8952f" strokeWidth="0.9" />
    </svg>
  );
}

const TILE: Record<Exclude<RecordKind, 'chip'>, string> = {
  whatsapp: 'bg-sky-50 text-sky-600 ring-sky-100',
  api: 'bg-violet-50 text-violet-600 ring-violet-100',
  esim: 'bg-orange-50 text-orange-600 ring-orange-100',
  fixo: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
};

export function KindIcon({ kind, large }: { kind: RecordKind; large?: boolean }) {
  if (kind === 'chip') return <SimIcon className={large ? 'h-12 w-10 shrink-0' : 'h-10 w-8 shrink-0'} />;
  const Icon = KIND_ICONS[kind];
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl ring-1 ${TILE[kind]} ${large ? 'h-12 w-10' : 'h-10 w-8'}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

// ---------- Tela ----------

export function NumbersView() {
  const { phones, numbers } = useStore();
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [kind, setKind] = useState<RecordKind | 'all'>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ record?: NumberRecord; prefill?: Partial<NumberRecordDraft> } | null>(null);

  const rows = useMemo(
    () =>
      buildRows(numbers, phones).sort(
        (a, b) =>
          Number(!a.record) - Number(!b.record) ||
          (a.record?.owner ?? '').localeCompare(b.record?.owner ?? '', 'pt-BR') ||
          a.number.localeCompare(b.number)
      ),
    [numbers, phones]
  );

  const byKind = useMemo(() => rows.filter((r) => kind === 'all' || r.kind === kind), [rows, kind]);

  const list = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    return byKind.filter((r) => {
      if (!matchesStatus(r, status)) return false;
      if (!q) return true;
      return (
        numberMatchesQuery(r.number, q) ||
        (r.record?.owner ?? '').toLowerCase().includes(q) ||
        (r.record?.carrier ?? '').toLowerCase().includes(q) ||
        r.usages.some((u) => u.phone.name.toLowerCase().includes(q) || (u.provider ?? '').toLowerCase().includes(q))
      );
    });
  }, [byKind, deferred, status]);

  const statusFilters: { key: StatusFilter; label: string; dots?: string[] }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'no-wa', label: 'Sem WhatsApp', dots: ['bg-emerald-500'] },
    { key: 'no-wb', label: 'Sem Business', dots: ['bg-teal-500'] },
    { key: 'no-both', label: 'Sem WhatsApp e sem Business', dots: ['bg-emerald-500', 'bg-teal-500'] },
    { key: 'nophone', label: 'Fora de aparelho' },
    { key: 'unregistered', label: 'Não cadastrados' },
  ];

  const open = openKey ? rows.find((r) => r.key === openKey) ?? null : null;
  const pill = (active: boolean) =>
    `flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition ${
      active ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50'
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-zinc-900 sm:text-3xl">Números</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {rows.length} números · chips, APIs, fixos e eSIMs e onde cada um é usado.
          </p>
        </div>
        <button onClick={() => setEditing({})} className="btn-primary hidden md:inline-flex">
          <Plus className="h-4 w-4" /> Novo número
        </button>
      </div>

      <div className="mt-5">
        <SearchField value={query} onChange={setQuery} placeholder="Buscar número, responsável, operadora ou celular" />
      </div>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        <button onClick={() => setKind('all')} className={pill(kind === 'all')}>
          Todos <span className={kind === 'all' ? 'text-white/60' : 'text-zinc-400'}>{rows.length}</span>
        </button>
        {KINDS.map((k) => {
          const count = rows.filter((r) => r.kind === k.kind).length;
          if (!count) return null;
          return (
            <button key={k.kind} onClick={() => setKind(k.kind)} className={pill(kind === k.kind)}>
              {k.label} <span className={kind === k.kind ? 'text-white/60' : 'text-zinc-400'}>{count}</span>
            </button>
          );
        })}
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(status === f.key ? 'all' : f.key)}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition ${
              status === f.key ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100'
            }`}
          >
            {f.dots && (
              <span className="flex -space-x-0.5">
                {f.dots.map((d) => (
                  <span key={d} className={`h-1.5 w-1.5 rounded-full ring-1 ring-white ${d}`} />
                ))}
              </span>
            )}
            {f.label} <span className="tabular-nums text-zinc-400">{byKind.filter((r) => matchesStatus(r, f.key)).length}</span>
          </button>
        ))}
      </div>

      <div className="mt-5">
        {rows.length === 0 ? (
          <EmptyState icon={Hash} title="Nenhum número ainda" />
        ) : list.length === 0 ? (
          <EmptyState icon={Search} title="Nada encontrado" />
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((r) => (
              <button
                key={r.key}
                onClick={() => setOpenKey(r.key)}
                className="flex items-start gap-3.5 rounded-[20px] bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-zinc-200/70 transition hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] hover:ring-zinc-300 active:scale-[0.99]"
              >
                <KindIcon kind={r.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[17px] font-semibold tracking-tight text-zinc-900">
                    <Highlight text={formatPhoneNumber(r.number)} query={deferred} />
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {r.record?.owner || <span className="italic text-zinc-400">Não cadastrado</span>}
                    {r.record?.carrier && <span className="text-zinc-400"> · {r.record.carrier}</span>}
                  </p>
                  {r.usages.length > 0 && (
                    <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-zinc-500">
                      <DeviceThumb model={r.usages[0].phone.model} seed={`${r.usages[0].phone.name}-${r.usages[0].phone.model}`} caseColor={r.usages[0].phone.caseColor} width={8} />
                      <span className="truncate">{[...new Set(r.usages.map((u) => u.phone.name))].join(', ')}</span>
                    </div>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {r.kind !== 'chip' && <SourceBadge source={r.kind} />}
                    {r.usages.some((u) => u.isNormal) && <WaBadge kind="normal" />}
                    {r.usages.some((u) => u.isBusiness) && <WaBadge kind="business" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setEditing({})}
        className="app-chrome fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-4 z-20 grid h-14 w-14 place-items-center rounded-2xl bg-zinc-900 text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] transition active:scale-95 md:hidden"
        aria-label="Novo número"
      >
        <Plus className="h-6 w-6" />
      </button>

      {open && (
        <NumberDetailSheet
          row={open}
          onClose={() => setOpenKey(null)}
          onEdit={(record, prefill) => setEditing({ record, prefill })}
        />
      )}
      {editing && (
        <NumberFormSheet
          record={editing.record}
          prefill={editing.prefill}
          onClose={() => setEditing(null)}
          onSaved={(rec) => {
            setEditing(null);
            setOpenKey(rec.id);
          }}
        />
      )}
    </div>
  );
}

// ---------- Detalhe ----------

function NumberDetailSheet({
  row,
  onClose,
  onEdit,
}: {
  row: NumberRow;
  onClose: () => void;
  onEdit: (record?: NumberRecord, prefill?: Partial<NumberRecordDraft>) => void;
}) {
  const { departmentById, removeNumber } = useStore();
  const [confirming, setConfirming] = useState(false);
  const rec = row.record;

  return (
    <>
      <Sheet
        title={<span className="text-sm font-medium text-zinc-400">Número</span>}
        onClose={onClose}
        footer={
          rec ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirming(true)} className="btn-secondary w-12 px-0 text-red-600" aria-label="Excluir número">
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={() => onEdit(rec)} className="btn-primary flex-1">
                <Pencil className="h-4 w-4" /> Editar
              </button>
            </div>
          ) : (
            <button
              onClick={() => onEdit(undefined, { number: row.number.replace(/\D/g, ''), kind: row.kind })}
              className="btn-primary w-full"
            >
              <Plus className="h-4 w-4" /> Cadastrar este número
            </button>
          )
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-100">
            <KindIcon kind={row.kind} large />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xl font-semibold tracking-tight">{formatPhoneNumber(row.number)}</p>
              <p className="text-sm text-zinc-500">{rec?.owner || 'Não cadastrado'}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <SourceBadge source={row.kind} size="md" />
              </div>
            </div>
            <CopyButton value={row.number.replace(/\D/g, '')} />
          </div>

          {rec && (
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {[
                ['Tipo', kindLabel(rec.kind)],
                ['Operadora', rec.carrier || '—'],
                ['Plano', rec.kind === 'fixo' ? '—' : rec.plan === 'pos' ? 'Pós-pago' : 'Pré-pago'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-inset ring-zinc-100">
                  <dt className="text-[11px] font-medium text-zinc-400">{k}</dt>
                  <dd className="font-medium text-zinc-800">{v}</dd>
                </div>
              ))}
              {rec.notes && (
                <div className="col-span-2 rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-inset ring-zinc-100">
                  <dt className="text-[11px] font-medium text-zinc-400">Observações</dt>
                  <dd className="whitespace-pre-wrap text-zinc-800">{rec.notes}</dd>
                </div>
              )}
            </dl>
          )}

          <div>
            <p className="label">Usado nos aparelhos</p>
            {row.usages.length === 0 ? (
              <p className="text-sm text-zinc-400">Não está cadastrado em nenhum celular.</p>
            ) : (
              <div className="space-y-2">
                {row.usages.map((u) => {
                  const dept = u.phone.departmentId ? departmentById.get(u.phone.departmentId)?.name : undefined;
                  return (
                    <div key={`${u.phone.id}-${u.id}`} className="flex items-center gap-3 rounded-2xl p-3 ring-1 ring-zinc-200/70">
                      <DeviceThumb model={u.phone.model} seed={`${u.phone.name}-${u.phone.model}`} caseColor={u.phone.caseColor} width={20} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{u.phone.name}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {u.label} · {kindLabel(u.source)}
                          {u.provider && ` (${u.provider})`}
                          {dept && ` · ${dept}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {u.isNormal && <WaBadge kind="normal" />}
                        {u.isBusiness && <WaBadge kind="business" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </Sheet>

      {confirming && rec && (
        <ConfirmSheet
          title="Excluir número?"
          message={
            <>
              O cadastro de <strong className="font-semibold text-zinc-800">{formatPhoneNumber(rec.number)}</strong> será
              excluído. Os celulares que usam esse número não são alterados.
            </>
          }
          onClose={() => setConfirming(false)}
          onConfirm={async () => {
            await removeNumber(rec.id);
            onClose();
          }}
        />
      )}
    </>
  );
}

// ---------- Formulário ----------

function NumberFormSheet({
  record,
  prefill,
  onClose,
  onSaved,
}: {
  record?: NumberRecord;
  prefill?: Partial<NumberRecordDraft>;
  onClose: () => void;
  onSaved: (rec: NumberRecord) => void;
}) {
  const { addNumber, updateNumber } = useStore();
  const base = record ?? prefill ?? {};
  const [number, setNumber] = useState(maskPhoneNumber(base.number ?? ''));
  const [kind, setKind] = useState<RecordKind>(base.kind ?? 'chip');
  const [carrier, setCarrier] = useState(base.carrier ?? '');
  const [owner, setOwner] = useState(base.owner ?? '');
  const [plan, setPlan] = useState<'pre' | 'pos'>(base.plan ?? 'pre');
  const [notes, setNotes] = useState(base.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = number.replace(/\D/g, '');
    if (digits.length < 10) return setError('Informe o número completo, com DDD.');
    const draft: NumberRecordDraft = {
      number: digits,
      kind,
      carrier: carrier.trim() || undefined,
      owner: owner.trim() || undefined,
      plan: kind === 'fixo' ? undefined : plan,
      notes: notes.trim() || undefined,
    };
    setSaving(true);
    setError(null);
    try {
      onSaved(record ? await updateNumber(record.id, draft) : await addNumber(draft));
    } catch {
      setSaving(false);
    }
  };

  return (
    <Sheet
      title={record ? 'Editar número' : 'Novo número'}
      onClose={onClose}
      size="lg"
      fullOnMobile
      footer={
        <div className="flex items-center gap-2">
          {error && <p className="mr-auto hidden text-sm text-red-600 sm:block">{error}</p>}
          <button type="button" onClick={onClose} className="btn-secondary flex-1 sm:flex-none">
            Cancelar
          </button>
          <button type="submit" form="number-form" disabled={saving} className="btn-primary flex-[2] sm:flex-none">
            {saving ? 'Salvando…' : record ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      }
    >
      <form id="number-form" onSubmit={submit} className="space-y-5 pt-1">
        <div>
          <label className="label">Número</label>
          <input
            type="tel"
            inputMode="tel"
            className="field font-mono"
            value={number}
            onChange={(e) => setNumber(maskPhoneNumber(e.target.value))}
            placeholder="(11) 91234-5678"
            autoFocus={!record}
          />
        </div>

        <div>
          <label className="label">Tipo</label>
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k.kind}
                type="button"
                onClick={() => setKind(k.kind)}
                className={`h-9 rounded-full px-3.5 text-[13px] font-semibold transition ${
                  kind === k.kind ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 ring-1 ring-zinc-200'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Responsável / setor</label>
            <input className="field" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Ex: Comercial, RH, Luiza" />
          </div>
          <div>
            <label className="label">Operadora</label>
            <input className="field" value={carrier} onChange={(e) => setCarrier(e.target.value)} list="carriers" placeholder="Ex: CLARO" />
            <datalist id="carriers">
              {['CLARO', 'TIM', 'VIVO', 'OI', 'ALGAR', 'NEXTEL'].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        {kind !== 'fixo' && (
          <div>
            <label className="label">Plano</label>
            <div className="inline-flex rounded-full bg-zinc-100 p-0.5">
              {(
                [
                  ['pre', 'Pré-pago'],
                  ['pos', 'Pós-pago'],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPlan(v)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    plan === v ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}


        <div>
          <label className="label">Observações</label>
          <textarea
            className="field h-auto min-h-20 py-2.5"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional"
          />
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 sm:hidden">{error}</p>}
      </form>
    </Sheet>
  );
}
