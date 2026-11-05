'use client';

import React, { useMemo, useState } from 'react';
import { Ban, Check, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../lib/phones/store';
import {
  ExtraNumber,
  kindInfo,
  NUMBER_KINDS,
  NumberKind,
  Phone,
  PhoneChip,
  PhoneDraft,
  WhatsAppAssignments,
} from '../../lib/phones/types';
import { KIND_ICONS } from '../ui/bits';
import { maskPhoneNumber } from '../../lib/phones/format';
import { CASE_COLOR_PRESETS, luminance, resolveDevice } from '../../lib/phones/devices';
import { PHONE_MODELS } from '../../lib/phones/models';
import { DeviceThumb } from '../device/DeviceThumb';
import { Sheet } from '../ui/Sheet';

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function WaToggle({ kind, active, onClick }: { kind: 'normal' | 'business'; active: boolean; onClick: () => void }) {
  const on = kind === 'normal' ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-teal-600 text-white ring-teal-600';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold ring-1 transition ${
        active ? on : 'bg-white text-zinc-500 ring-zinc-200 hover:ring-zinc-300'
      }`}
    >
      {active && <Check className="h-3 w-3" />}
      {kind === 'normal' ? 'WhatsApp' : 'Business'}
    </button>
  );
}

function ModelField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q ? PHONE_MODELS.filter((m) => m.toLowerCase().includes(q) && m.toLowerCase() !== q) : PHONE_MODELS;
    return list.slice(0, 6);
  }, [value]);

  return (
    <div className="relative">
      <input
        className="field"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Ex: Samsung Galaxy A06"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1.5 max-h-72 w-full overflow-auto rounded-2xl bg-white p-1 shadow-xl ring-1 ring-zinc-200">
          {suggestions.map((m) => (
            <li key={m}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(m);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              >
                <DeviceThumb model={m} view="back" width={14} />
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PhoneFormSheet({
  initial,
  defaultDepartmentId,
  onClose,
  onSaved,
}: {
  initial?: Phone;
  defaultDepartmentId?: string;
  onClose: () => void;
  onSaved: (phone: Phone) => void;
}) {
  const { departments, addPhone, updatePhone, addDepartment } = useStore();
  const [name, setName] = useState(initial?.name ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [chips, setChips] = useState<PhoneChip[]>(initial ? initial.chips : [{ id: uid(), label: 'Chip 1', number: '' }]);
  const [extras, setExtras] = useState<ExtraNumber[]>(initial?.extraNumbers ?? []);
  const [whatsapp, setWhatsapp] = useState<WhatsAppAssignments>(initial?.whatsapp ?? {});
  const [caseColor, setCaseColor] = useState<string | undefined>(initial?.caseColor);
  const [departmentId, setDepartmentId] = useState<string | undefined>(initial?.departmentId ?? defaultDepartmentId);
  const [newDept, setNewDept] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const spec = resolveDevice(model);
  const seed = `${name}-${model}`;

  const setChipCount = (count: 0 | 1 | 2) => {
    const next = [...chips.slice(0, count)];
    while (next.length < count) next.push({ id: uid(), label: `Chip ${next.length + 1}`, number: '' });
    const removed = new Set(chips.slice(count).map((c) => c.id));
    setChips(next);
    setWhatsapp((w) => ({
      normal: w.normal && removed.has(w.normal) ? undefined : w.normal,
      business: w.business && removed.has(w.business) ? undefined : w.business,
    }));
  };

  const addExtra = (kind: NumberKind) =>
    setExtras((prev) => [...prev, { id: uid(), label: '', number: '', kind }]);

  const updateExtra = (id: string, patch: Partial<ExtraNumber>) =>
    setExtras((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const toggleWa = (kind: 'normal' | 'business', id: string) =>
    setWhatsapp((w) => ({ ...w, [kind]: w[kind] === id ? undefined : id }));

  const removeExtra = (id: string) => {
    setExtras((prev) => prev.filter((e) => e.id !== id));
    setWhatsapp((w) => ({
      normal: w.normal === id ? undefined : w.normal,
      business: w.business === id ? undefined : w.business,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filledChips = chips.filter((c) => c.number.trim());
    const filledExtras = extras.filter((x) => x.number.trim());
    if (!name.trim()) return setError('Dê um nome para identificar este celular.');
    if (!model.trim()) return setError('Informe o modelo do celular.');
    if (filledChips.length === 0 && filledExtras.length === 0)
      return setError('Cadastre pelo menos um número (chip, eSIM, WhatsApp sem chip ou API).');

    const pool = new Set([...filledChips, ...filledExtras].map((n) => n.id));
    const draft: PhoneDraft = {
      name: name.trim(),
      model: model.trim(),
      chips,
      extraNumbers: filledExtras.map((x) => ({
        id: x.id,
        label: x.label.trim(),
        number: x.number,
        kind: x.kind ?? 'whatsapp',
        ...(x.kind === 'api' && x.provider?.trim() ? { provider: x.provider.trim() } : {}),
      })),
      whatsapp: {
        normal: whatsapp.normal && pool.has(whatsapp.normal) ? whatsapp.normal : undefined,
        business: whatsapp.business && pool.has(whatsapp.business) ? whatsapp.business : undefined,
      },
      caseColor,
      departmentId,
    };

    setSaving(true);
    setError(null);
    try {
      const saved = initial ? await updatePhone(initial.id, draft) : await addPhone(draft);
      onSaved(saved);
    } catch {
      setSaving(false);
    }
  };

  const confirmDept = async () => {
    if (!newDept?.trim()) return setNewDept(null);
    const created = await addDepartment(newDept).catch(() => null);
    if (created) setDepartmentId(created.id);
    setNewDept(null);
  };

  return (
    <Sheet
      title={initial ? 'Editar celular' : 'Novo celular'}
      onClose={onClose}
      size="lg"
      fullOnMobile
      footer={
        <div className="flex items-center gap-2">
          {error && <p className="mr-auto hidden text-sm text-red-600 sm:block">{error}</p>}
          <button type="button" onClick={onClose} className="btn-secondary flex-1 sm:flex-none">
            Cancelar
          </button>
          <button type="submit" form="phone-form" disabled={saving} className="btn-primary flex-[2] sm:flex-none">
            {saving ? 'Salvando…' : initial ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      }
    >
      <form id="phone-form" onSubmit={submit} className="space-y-6 pt-1">
        {/* Prévia */}
        <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-b from-zinc-50 to-zinc-100 p-4 ring-1 ring-inset ring-zinc-100">
          <div className="flex gap-2">
            <DeviceThumb model={model} seed={seed} caseColor={caseColor} view="front" width={44} className="drop-shadow" />
            <DeviceThumb model={model} seed={seed} caseColor={caseColor} view="back" width={44} className="drop-shadow-md" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-900">{name || 'Nome do celular'}</p>
            <p className="truncate text-sm text-zinc-500">{model || 'Modelo'}</p>
            <p className="mt-1 text-xs text-zinc-400">{model ? `Miniatura: ${spec.family}` : 'A miniatura muda conforme o modelo'}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nome</label>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Recepção, iPhone do João" />
          </div>
          <div>
            <label className="label">Modelo</label>
            <ModelField value={model} onChange={setModel} />
          </div>
        </div>

        <div>
          <label className="label">Departamento</label>
          {newDept === null ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  className="field appearance-none pr-9"
                  value={departmentId ?? ''}
                  onChange={(e) => setDepartmentId(e.target.value || undefined)}
                >
                  <option value="">Sem departamento</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              </div>
              <button type="button" onClick={() => setNewDept('')} className="btn-secondary shrink-0">
                <Plus className="h-4 w-4" /> Novo
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                autoFocus
                className="field"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmDept();
                  }
                  if (e.key === 'Escape') setNewDept(null);
                }}
                placeholder="Nome do departamento"
              />
              <button type="button" onClick={confirmDept} className="btn-primary shrink-0">
                Criar
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="label">Cor da capinha</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCaseColor(undefined)}
              title="Sem capinha"
              className={`grid h-9 w-9 place-items-center rounded-full bg-white text-zinc-400 ring-1 transition ${
                !caseColor ? 'ring-2 ring-zinc-900 ring-offset-2' : 'ring-zinc-200'
              }`}
            >
              <Ban className="h-4 w-4" />
            </button>
            {CASE_COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCaseColor(c)}
                title={c}
                style={{ backgroundColor: c }}
                className={`grid h-9 w-9 place-items-center rounded-full ring-1 ring-black/10 transition ${
                  caseColor?.toLowerCase() === c ? 'ring-2 ring-zinc-900 ring-offset-2' : ''
                }`}
              >
                {caseColor?.toLowerCase() === c && (
                  <Check className={`h-4 w-4 ${luminance(c) > 0.5 ? 'text-zinc-800' : 'text-white'}`} />
                )}
              </button>
            ))}
            <label
              title="Outra cor"
              className="relative grid h-9 w-9 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-zinc-300 text-zinc-400"
              style={caseColor && !CASE_COLOR_PRESETS.includes(caseColor.toLowerCase()) ? { backgroundColor: caseColor, borderStyle: 'solid' } : undefined}
            >
              <Plus className="h-4 w-4" />
              <input
                type="color"
                value={caseColor ?? '#3b82f6'}
                onChange={(e) => setCaseColor(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label mb-0">Chips</label>
            <div className="inline-flex rounded-full bg-zinc-100 p-0.5">
              {[0, 1, 2].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setChipCount(n as 0 | 1 | 2)}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    chips.length === n ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
                  }`}
                >
                  {n === 0 ? 'Sem chip' : `${n} chip${n > 1 ? 's' : ''}`}
                </button>
              ))}
            </div>
          </div>
          {chips.length === 0 && (
            <p className="rounded-2xl bg-zinc-50 px-3.5 py-3 text-xs text-zinc-500 ring-1 ring-inset ring-zinc-100">
              Aparelho sem chip físico. Cadastre abaixo os números usados nele (WhatsApp sem chip, API ou eSIM).
            </p>
          )}
          <div className="space-y-2">
            {chips.map((chip) => (
              <div key={chip.id} className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-100">
                <div className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-400">{chip.label}</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    className="field font-mono"
                    value={chip.number}
                    onChange={(e) =>
                      setChips((prev) => prev.map((c) => (c.id === chip.id ? { ...c, number: maskPhoneNumber(e.target.value) } : c)))
                    }
                    placeholder="(11) 91234-5678 ou 5678"
                  />
                </div>
                <div className="mt-2 flex gap-1.5 pl-[60px]">
                  <WaToggle kind="normal" active={whatsapp.normal === chip.id} onClick={() => toggleWa('normal', chip.id)} />
                  <WaToggle kind="business" active={whatsapp.business === chip.id} onClick={() => toggleWa('business', chip.id)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Outros números</label>
          <p className="mb-2 text-xs text-zinc-400">Números deste aparelho que não estão num chip físico.</p>
          <div className="mb-2 grid grid-cols-3 gap-2">
            {NUMBER_KINDS.map((k) => {
              const Icon = KIND_ICONS[k.kind];
              return (
                <button
                  key={k.kind}
                  type="button"
                  onClick={() => addExtra(k.kind)}
                  className="flex flex-col items-center gap-1 rounded-2xl bg-white px-2 py-2.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-50 active:scale-[0.98]"
                >
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3 text-zinc-400" />
                    <Icon className="h-4 w-4 text-zinc-500" />
                  </span>
                  {k.label}
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            {extras.map((x) => (
              <div key={x.id} className="rounded-2xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-100">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="no-scrollbar flex gap-1 overflow-x-auto">
                    {NUMBER_KINDS.map((k) => {
                      const active = (x.kind ?? 'whatsapp') === k.kind;
                      return (
                        <button
                          key={k.kind}
                          type="button"
                          onClick={() => updateExtra(x.id, { kind: k.kind })}
                          className={`h-7 shrink-0 rounded-full px-2.5 text-[11px] font-semibold transition ${
                            active ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 ring-1 ring-zinc-200'
                          }`}
                        >
                          {k.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExtra(x.id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Remover número"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    className="field w-28 shrink-0 sm:w-36"
                    value={x.label}
                    onChange={(e) => updateExtra(x.id, { label: e.target.value })}
                    placeholder={x.kind === 'api' ? 'Ex: Atendimento' : 'Rótulo'}
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    className="field font-mono"
                    value={x.number}
                    onChange={(e) => updateExtra(x.id, { number: maskPhoneNumber(e.target.value) })}
                    placeholder="Número"
                  />
                </div>
                {x.kind === 'api' && (
                  <input
                    className="field mt-2"
                    value={x.provider ?? ''}
                    onChange={(e) => updateExtra(x.id, { provider: e.target.value })}
                    placeholder="Provedor (ex: Meta Cloud API, Z-API, Blip)"
                    list="api-providers"
                  />
                )}
                <p className="mt-1.5 text-[11px] text-zinc-400">{kindInfo(x.kind).hint}</p>
                <div className="mt-2 flex gap-1.5">
                  <WaToggle kind="normal" active={whatsapp.normal === x.id} onClick={() => toggleWa('normal', x.id)} />
                  <WaToggle kind="business" active={whatsapp.business === x.id} onClick={() => toggleWa('business', x.id)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <datalist id="api-providers">
          {['Meta Cloud API', 'Z-API', 'Evolution API', 'Blip', 'Twilio', 'Gupshup', '360dialog', 'Take Blip'].map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 sm:hidden">{error}</p>}
      </form>
    </Sheet>
  );
}
