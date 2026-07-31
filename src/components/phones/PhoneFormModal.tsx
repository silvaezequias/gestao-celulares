'use client';

import React, { useState } from 'react';
import { X, Smartphone, Building2, Plus, Ban, Trash2, Tag } from 'lucide-react';
import { Department, ExtraNumber, Phone, PhoneChip, PhoneDraft, WhatsAppAssignments } from '../../lib/phones/types';
import { PhoneModelInput } from './PhoneModelInput';
import { PhoneMockup } from './PhoneMockup';
import { CASE_COLOR_PRESETS } from '../../lib/phones/colors';
import { maskPhoneNumber } from '../../lib/phones/format';

interface PhoneFormModalProps {
  initial?: Phone;
  departments: Department[];
  onCreateDepartment: (name: string) => Promise<Department | null>;
  onClose: () => void;
  onSubmit: (draft: PhoneDraft) => void;
}

function createChipId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeEmptyChip(label: string): PhoneChip {
  return { id: createChipId(), label, number: '' };
}

function makeEmptyExtraNumber(): ExtraNumber {
  return { id: createChipId(), label: '', number: '' };
}

export const PhoneFormModal: React.FC<PhoneFormModalProps> = ({
  initial,
  departments,
  onCreateDepartment,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [chips, setChips] = useState<PhoneChip[]>(
    initial?.chips ?? [makeEmptyChip('Chip 1')]
  );
  const [extraNumbers, setExtraNumbers] = useState<ExtraNumber[]>(initial?.extraNumbers ?? []);
  const [whatsapp, setWhatsapp] = useState<WhatsAppAssignments>(initial?.whatsapp ?? {});
  const [caseColor, setCaseColor] = useState<string | undefined>(initial?.caseColor);
  const [departmentId, setDepartmentId] = useState<string | undefined>(initial?.departmentId);
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const hasTwoChips = chips.length === 2;

  const toggleChipCount = (count: 1 | 2) => {
    if (count === 1) {
      const removedId = chips[1]?.id;
      setChips([chips[0]]);
      setWhatsapp((prev) => ({
        normal: prev.normal === removedId ? undefined : prev.normal,
        business: prev.business === removedId ? undefined : prev.business,
      }));
    } else if (chips.length === 1) {
      setChips([chips[0], makeEmptyChip('Chip 2')]);
    }
  };

  const updateChipNumber = (chipId: string, number: string) => {
    setChips((prev) => prev.map((c) => (c.id === chipId ? { ...c, number: maskPhoneNumber(number) } : c)));
  };

  const addExtraNumber = () => {
    setExtraNumbers((prev) => [...prev, makeEmptyExtraNumber()]);
  };

  const updateExtraNumber = (id: string, patch: Partial<ExtraNumber>) => {
    setExtraNumbers((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const removeExtraNumber = (id: string) => {
    setExtraNumbers((prev) => prev.filter((e) => e.id !== id));
    setWhatsapp((prev) => ({
      normal: prev.normal === id ? undefined : prev.normal,
      business: prev.business === id ? undefined : prev.business,
    }));
  };

  const confirmNewDepartment = async () => {
    const created = await onCreateDepartment(newDepartmentName);
    if (created) {
      setDepartmentId(created.id);
      setNewDepartmentName('');
      setCreatingDepartment(false);
    }
  };

  const chipsWithNumber = chips.filter((c) => c.number.trim().length > 0);
  const extraNumbersWithNumber = extraNumbers.filter((e) => e.number.trim().length > 0);
  // Pool de números que podem ser escolhidos pro WhatsApp: os chips físicos
  // mais os números extras cadastrados só pra esse fim.
  const whatsappPool: { id: string; label: string; number: string }[] = [
    ...chipsWithNumber.map((c) => ({ id: c.id, label: c.label, number: c.number })),
    ...extraNumbersWithNumber.map((e) => ({ id: e.id, label: e.label.trim() || 'Extra', number: e.number })),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Dê um nome para identificar este celular.');
      return;
    }
    if (!model.trim()) {
      setError('Informe o modelo do celular.');
      return;
    }
    if (chipsWithNumber.length === 0) {
      setError('Cadastre pelo menos um número de chip.');
      return;
    }

    const cleanedWhatsapp: WhatsAppAssignments = {
      normal: whatsapp.normal && whatsappPool.some((n) => n.id === whatsapp.normal) ? whatsapp.normal : undefined,
      business: whatsapp.business && whatsappPool.some((n) => n.id === whatsapp.business) ? whatsapp.business : undefined,
    };

    onSubmit({
      name: name.trim(),
      model: model.trim(),
      chips,
      extraNumbers: extraNumbersWithNumber,
      whatsapp: cleanedWhatsapp,
      caseColor,
      departmentId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-semibold text-lg text-slate-900">
            {initial ? 'Editar celular' : 'Cadastrar celular'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex gap-5">
            <div className="shrink-0 flex gap-2">
              <PhoneMockup model={model} seedKey={`${name}-${model}`} caseColor={caseColor} view="front" size={64} />
              <PhoneMockup model={model} seedKey={`${name}-${model}`} caseColor={caseColor} view="back" size={64} />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Nome do celular</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Celular da recepção, iPhone do João..."
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Modelo</label>
                <PhoneModelInput value={model} onChange={setModel} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Cor da capinha (opcional)</label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCaseColor(undefined)}
                title="Sem capinha"
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center bg-white text-slate-400 transition-all cursor-pointer ${
                  !caseColor ? 'border-blue-500 scale-110' : 'border-slate-200'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
              </button>

              {CASE_COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCaseColor(color)}
                  title={color}
                  style={{ backgroundColor: color }}
                  className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                    caseColor === color ? 'border-blue-500 scale-110' : 'border-transparent'
                  }`}
                />
              ))}

              <label
                title="Escolher outra cor"
                className="relative w-7 h-7 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 cursor-pointer overflow-hidden hover:border-slate-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <input
                  type="color"
                  value={caseColor ?? '#3b82f6'}
                  onChange={(e) => setCaseColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Departamento
            </label>

            {!creatingDepartment ? (
              <div className="flex gap-2">
                <select
                  value={departmentId ?? ''}
                  onChange={(e) => setDepartmentId(e.target.value || undefined)}
                  className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white"
                >
                  <option value="">Sem departamento</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCreatingDepartment(true)}
                  className="px-3 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      confirmNewDepartment();
                    }
                  }}
                  placeholder="Nome do novo departamento"
                  className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
                <button
                  type="button"
                  onClick={confirmNewDepartment}
                  className="px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingDepartment(false);
                    setNewDepartmentName('');
                  }}
                  className="px-3 py-2.5 rounded-lg text-slate-500 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">Quantidade de chips</label>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => toggleChipCount(1)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    !hasTwoChips ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  1 chip
                </button>
                <button
                  type="button"
                  onClick={() => toggleChipCount(2)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    hasTwoChips ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  2 chips
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {chips.map((chip) => (
                <div key={chip.id} className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-500 w-14 shrink-0">{chip.label}</span>
                  <input
                    type="tel"
                    value={chip.number}
                    onChange={(e) => updateChipNumber(chip.id, e.target.value)}
                    placeholder="Completo ou só os 4 últimos, ex: 5678"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Números extras (só pro WhatsApp)
              </label>
              <button
                type="button"
                onClick={addExtraNumber}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Use quando o WhatsApp Normal ou Business estiver logado num número diferente dos chips deste aparelho.
            </p>

            {extraNumbers.length > 0 && (
              <div className="space-y-3">
                {extraNumbers.map((extra) => (
                  <div key={extra.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={extra.label}
                      onChange={(e) => updateExtraNumber(extra.id, { label: e.target.value })}
                      placeholder="Rótulo (ex: Comercial)"
                      className="w-32 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    />
                    <input
                      type="tel"
                      value={extra.number}
                      onChange={(e) => updateExtraNumber(extra.id, { number: maskPhoneNumber(e.target.value) })}
                      placeholder="Completo ou só os 4 últimos, ex: 5678"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => removeExtraNumber(extra.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      aria-label="Remover número extra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Atribuição de WhatsApp</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                  WhatsApp Normal
                </label>
                <select
                  value={whatsapp.normal ?? ''}
                  onChange={(e) => setWhatsapp((prev) => ({ ...prev, normal: e.target.value || undefined }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white"
                >
                  <option value="">Nenhum</option>
                  {whatsappPool.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} — {c.number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                  WhatsApp Business
                </label>
                <select
                  value={whatsapp.business ?? ''}
                  onChange={(e) => setWhatsapp((prev) => ({ ...prev, business: e.target.value || undefined }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white"
                >
                  <option value="">Nenhum</option>
                  {whatsappPool.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} — {c.number}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {initial ? 'Salvar alterações' : 'Cadastrar celular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
