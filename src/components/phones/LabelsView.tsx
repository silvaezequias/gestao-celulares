'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Printer, Lock, Pencil, FlipHorizontal2 } from 'lucide-react';
import { useStore } from '../../lib/phones/store';
import { Phone } from '../../lib/phones/types';
import { resolveNumberById } from '../../lib/phones/resolve';
import { formatPhoneNumber } from '../../lib/phones/format';
import { formatRelativeTime } from '../../lib/phones/relativeTime';
import { bodyColorFor } from '../../lib/phones/devices';
import { LABEL_PRESETS, LabelPreset } from '../../lib/phones/labelPresets';
import { RulerSlider } from './RulerSlider';
import { MarginGuides, MarginEdge, PageMargins } from './MarginGuides';

const DEFAULT_COLUMNS = 3;
const DEFAULT_ROWS = 7;

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_PX = (A4_WIDTH_MM / 25.4) * 96;
const A4_HEIGHT_PX = (A4_HEIGHT_MM / 25.4) * 96;

const SETTINGS_KEY = 'gestao-celulares:labels-settings:v2';
const DEFAULT_MARGIN_CM = 2;
const DEFAULT_GAP_CM = 0.5;
const MARGIN_MIN_CM = 0.5;
const MARGIN_MAX_CM = 3;
const GAP_MIN_CM = 0;
const GAP_MAX_CM = 1.5;
const DEFAULT_MARGINS: PageMargins = {
  top: DEFAULT_MARGIN_CM,
  right: DEFAULT_MARGIN_CM,
  bottom: DEFAULT_MARGIN_CM,
  left: DEFAULT_MARGIN_CM,
};

interface StoredSettings {
  margins?: PageMargins;
  gapRowCm?: number;
  gapColCm?: number;
  columns?: number;
  rows?: number;
  mirrorMode?: boolean;
  activePresetId?: string | null;
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

const Label: React.FC<{ phone: Phone }> = ({ phone }) => {
  const normalNumber = resolveNumberById(phone, phone.whatsapp.normal);
  const businessNumber = resolveNumberById(phone, phone.whatsapp.business);
  const chipsWithNumber = phone.chips.filter((c) => c.number.trim());
  const borderColor = bodyColorFor(`${phone.name}-${phone.model}`, phone.caseColor);

  return (
    <div className="label-cell" style={{ borderColor }}>
      <div style={{ fontSize: '8.5pt', fontWeight: 700, lineHeight: 1.15, color: '#0f172a' }}>{phone.name}</div>
      <div style={{ fontSize: '6.5pt', color: '#64748b', lineHeight: 1.15, marginBottom: '1mm' }}>{phone.model}</div>

      {chipsWithNumber.map((chip) => (
        <div key={chip.id} style={{ fontSize: '7pt', fontFamily: 'monospace', lineHeight: 1.3, color: '#1e293b' }}>
          <span style={{ color: '#94a3b8', fontWeight: 700 }}>{chip.label}: </span>
          {formatPhoneNumber(chip.number)}
        </div>
      ))}

      {(normalNumber || businessNumber) && (
        <div style={{ marginTop: '1mm', borderTop: '0.5pt solid #e2e8f0', paddingTop: '0.8mm' }}>
          {normalNumber && (
            <div style={{ fontSize: '7pt', fontFamily: 'monospace', lineHeight: 1.3, color: '#166534' }}>
              <span style={{ fontWeight: 700 }}>WhatsApp: </span>
              {formatPhoneNumber(normalNumber)}
            </div>
          )}
          {businessNumber && (
            <div style={{ fontSize: '7pt', fontFamily: 'monospace', lineHeight: 1.3, color: '#0f766e' }}>
              <span style={{ fontWeight: 700 }}>Business: </span>
              {formatPhoneNumber(businessNumber)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const LabelsView: React.FC = () => {
  const { phones } = useStore();
  const loaded = true;
  const [margins, setMargins] = useState<PageMargins>(DEFAULT_MARGINS);
  const [gapRowCm, setGapRowCm] = useState(DEFAULT_GAP_CM);
  const [gapColCm, setGapColCm] = useState(DEFAULT_GAP_CM);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [mirrorMode, setMirrorMode] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const pageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const activePreset = activePresetId ? LABEL_PRESETS.find((p) => p.id === activePresetId) ?? null : null;
  const isLocked = !!activePreset?.locked;

  // Carrega configuração salva; se um preset travado estava ativo, os
  // valores vêm de novo do JSON (não do que ficou salvo), assim uma edição
  // manual no arquivo de presets é sempre respeitada.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed: StoredSettings = JSON.parse(raw);
        const preset = parsed.activePresetId
          ? LABEL_PRESETS.find((p) => p.id === parsed.activePresetId)
          : undefined;
        if (preset) {
          applyPreset(preset);
        } else {
          if (parsed.margins && typeof parsed.margins.top === 'number') setMargins(parsed.margins);
          if (typeof parsed.gapRowCm === 'number') setGapRowCm(parsed.gapRowCm);
          if (typeof parsed.gapColCm === 'number') setGapColCm(parsed.gapColCm);
          if (typeof parsed.columns === 'number') setColumns(parsed.columns);
          if (typeof parsed.rows === 'number') setRows(parsed.rows);
        }
        if (typeof parsed.mirrorMode === 'boolean') setMirrorMode(parsed.mirrorMode);
      }
    } catch {
      // ignora configuração corrompida e mantém os padrões
    }
    setSettingsLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    const toSave: StoredSettings = { margins, gapRowCm, gapColCm, columns, rows, mirrorMode, activePresetId };
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
  }, [margins, gapRowCm, gapColCm, columns, rows, mirrorMode, activePresetId, settingsLoaded]);

  // Escala a folha A4 pra caber na largura disponível (a altura pode
  // rolar — não precisa forçar a folha inteira dentro da tela).
  useEffect(() => {
    function recomputeScale() {
      const availableWidth = (viewportRef.current?.clientWidth ?? window.innerWidth) - 32;
      const next = Math.min(availableWidth / A4_WIDTH_PX, 1);
      setScale(next > 0 ? next : 1);
    }
    recomputeScale();
    window.addEventListener('resize', recomputeScale);
    return () => window.removeEventListener('resize', recomputeScale);
  }, []);

  // Seleciona automaticamente qualquer celular que apareça pela primeira
  // vez (inclusive todos, na primeira carga) — o usuário pode desmarcar os
  // que não quer imprimir.
  useEffect(() => {
    if (!loaded) return;
    // A mutação da ref fica aqui fora, no corpo do efeito — o updater do
    // setState precisa ser puro (o React Strict Mode invoca ele 2x em dev
    // pra detectar exatamente esse tipo de efeito colateral impuro).
    const newIds: string[] = [];
    phones.forEach((p) => {
      if (!seenIdsRef.current.has(p.id)) {
        seenIdsRef.current.add(p.id);
        newIds.push(p.id);
      }
    });
    if (newIds.length === 0) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      newIds.forEach((id) => next.add(id));
      return next;
    });
  }, [phones, loaded]);

  function applyPreset(preset: LabelPreset) {
    setColumns(preset.columns);
    setRows(preset.rows);
    setMargins({
      top: preset.marginTopCm,
      right: preset.marginRightCm,
      bottom: preset.marginBottomCm,
      left: preset.marginLeftCm,
    });
    setGapRowCm(preset.gapRowCm);
    setGapColCm(preset.gapColCm);
    setActivePresetId(preset.id);
  }

  const handleMarginChange = (edge: MarginEdge, value: number) => {
    if (isLocked) return;
    setMargins((prev) => {
      const next = { ...prev, [edge]: value };
      if (mirrorMode) {
        if (edge === 'top') next.bottom = value;
        if (edge === 'bottom') next.top = value;
        if (edge === 'left') next.right = value;
        if (edge === 'right') next.left = value;
      }
      return next;
    });
    setActivePresetId(null);
  };

  const handleGapRowChange = (value: number) => {
    if (isLocked) return;
    setGapRowCm(value);
    setActivePresetId(null);
  };

  const handleGapColChange = (value: number) => {
    if (isLocked) return;
    setGapColCm(value);
    setActivePresetId(null);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(phones.map((p) => p.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const recencyOrderedPhones = useMemo(
    () => [...phones].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [phones]
  );

  const printablePhones = useMemo(
    () =>
      phones
        .filter((p) => selectedIds.has(p.id))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [phones, selectedIds]
  );
  const labelsPerPage = columns * rows;
  const pages = useMemo(() => chunk(printablePhones, labelsPerPage), [printablePhones, labelsPerPage]);

  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }

        .labels-toolbar {
          max-width: 72rem;
          margin: 0 auto;
          padding: 1.5rem 1rem 0 1rem;
        }
        @media (min-width: 640px) { .labels-toolbar { padding: 2rem 1.5rem 0 1.5rem; }
        }

        .a4-frame {
          margin: 0 auto 12mm auto;
          overflow: hidden;
        }

        .a4-page {
          position: relative;
          width: 210mm;
          height: 297mm;
          padding: ${margins.top * 10}mm ${margins.right * 10}mm ${margins.bottom * 10}mm ${margins.left * 10}mm;
          box-sizing: border-box;
          background: white;
          box-shadow: 0 0 0 1px #e2e8f0, 0 4px 16px rgba(0,0,0,0.06);
          display: grid;
          grid-template-columns: repeat(${columns}, 1fr);
          grid-template-rows: repeat(${rows}, 1fr);
          gap: ${gapRowCm * 10}mm ${gapColCm * 10}mm;
          transform-origin: top left;
        }

        .label-cell {
          border: 3pt solid #94a3b8;
          border-radius: 3mm;
          background: transparent;
          padding: 2.5mm 3mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
        }

        .ruler-range {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          margin: 0;
        }
        .ruler-range::-webkit-slider-runnable-track { background: transparent; height: 100%; }
        .ruler-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 22px;
          border-radius: 3px;
          background: #2563eb;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.35);
          cursor: grab;
          margin-top: 3px;
        }
        .ruler-range::-webkit-slider-thumb:active { cursor: grabbing; }
        .ruler-range::-moz-range-track { background: transparent; height: 100%; }
        .ruler-range::-moz-range-thumb {
          width: 12px;
          height: 22px;
          border-radius: 3px;
          background: #2563eb;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.35);
          cursor: grab;
        }
        .ruler-range:disabled::-webkit-slider-thumb { background: #94a3b8; cursor: not-allowed; }
        .ruler-range:disabled::-moz-range-thumb { background: #94a3b8; cursor: not-allowed; }

        .margin-guides { position: absolute; inset: 0; pointer-events: none; z-index: 5; }
        .margin-guides-locked { opacity: 0.55; }
        .margin-guide { position: absolute; pointer-events: auto; }
        .margin-guides-locked .margin-guide { pointer-events: none; }
        .margin-guide-h {
          left: 0;
          right: 0;
          height: 20px;
          margin-top: -10px;
          cursor: ns-resize;
        }
        .margin-guide-h::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 2px;
          background: #2563eb;
          opacity: 0.85;
          transform: translateY(-50%);
        }
        .margin-guide-v {
          top: 0;
          bottom: 0;
          width: 20px;
          margin-left: -10px;
          cursor: ew-resize;
        }
        .margin-guide-v::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 2px;
          background: #2563eb;
          opacity: 0.85;
          transform: translateX(-50%);
        }
        .margin-guide-handle { position: absolute; width: 0; height: 0; }
        .margin-guide-handle-left {
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          border-top: 9px solid transparent;
          border-bottom: 9px solid transparent;
          border-right: 13px solid #2563eb;
        }
        .margin-guide-handle-top {
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 9px solid transparent;
          border-right: 9px solid transparent;
          border-bottom: 13px solid #2563eb;
        }
        .margin-guide-value {
          position: absolute;
          left: 26px;
          top: 50%;
          transform: translateY(-50%);
          background: #2563eb;
          color: white;
          font-size: 13px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 4px;
          white-space: nowrap;
          font-family: monospace;
        }
        .margin-guide-value-v {
          left: 50%;
          top: 26px;
          transform: translateX(-50%);
        }

        @media print {
          .no-print { display: none !important; }
          html, body {
            background: white;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm;
          }
          .labels-viewport {
            padding: 0 !important;
            margin: 0 !important;
          }
          .a4-frame {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0;
            overflow: visible;
            page-break-after: always;
          }
          .a4-frame:last-child { page-break-after: auto; }
          .a4-page {
            width: 210mm;
            height: 297mm;
            margin: 0;
            box-shadow: none;
            transform: none !important;
          }
        }
      `}</style>

      <div className="no-print">
        <div className="labels-toolbar space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[26px] font-semibold tracking-tight text-zinc-900 sm:text-3xl">Etiquetas</h1>
              <p className="mt-0.5 text-sm text-zinc-500">
                A4 · grade {columns}×{rows} · {printablePhones.length} de {phones.length} selecionados ·{' '}
                {pages.length || 0} página{pages.length === 1 ? '' : 's'}
              </p>
            </div>

            <button onClick={() => window.print()} className="btn-primary shrink-0">
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>

          <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
            {LABEL_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`inline-flex shrink-0 items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-semibold border transition-colors cursor-pointer ${
                  activePresetId === preset.id
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {preset.locked && <Lock className="w-3 h-3" />}
                {preset.name}
              </button>
            ))}

            {isLocked && (
              <button
                onClick={() => setActivePresetId(null)}
                className="inline-flex shrink-0 items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-medium border border-dashed border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                Editar manualmente
              </button>
            )}

            <label
              className={`inline-flex shrink-0 items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-medium border cursor-pointer transition-colors ${
                mirrorMode ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-600'
              } ${isLocked ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <input
                type="checkbox"
                checked={mirrorMode}
                onChange={(e) => setMirrorMode(e.target.checked)}
                disabled={isLocked}
                className="sr-only"
              />
              <FlipHorizontal2 className="w-3.5 h-3.5" />
              Espelhar margens opostas
            </label>
          </div>

          {isLocked && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              Medidas fixas de &quot;{activePreset?.name}&quot; — as réguas e os sliders ficam travados enquanto esse
              preset estiver selecionado. Clique em &quot;Editar manualmente&quot; pra ajustar livremente.
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <RulerSlider
              label="Espaço vertical"
              value={gapRowCm}
              min={GAP_MIN_CM}
              max={GAP_MAX_CM}
              step={0.1}
              disabled={isLocked}
              onChange={handleGapRowChange}
            />
            <RulerSlider
              label="Espaço horizontal"
              value={gapColCm}
              min={GAP_MIN_CM}
              max={GAP_MAX_CM}
              step={0.1}
              disabled={isLocked}
              onChange={handleGapColChange}
            />
          </div>

          <div className="rounded-[20px] bg-white ring-1 ring-zinc-200/70">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
              <p className="text-sm font-semibold text-zinc-700">
                Selecionar etiquetas para impressão
                <span className="text-zinc-400 font-normal ml-1.5">(ordenado por alteração recente)</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs font-medium text-zinc-900 hover:text-zinc-600 transition-colors cursor-pointer"
                >
                  Selecionar todos
                </button>
                <span className="text-zinc-300">•</span>
                <button
                  onClick={clearSelection}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  Limpar seleção
                </button>
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-zinc-50">
              {recencyOrderedPhones.map((phone) => (
                <label
                  key={phone.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(phone.id)}
                    onChange={() => toggleSelected(phone.id)}
                    className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-zinc-800 flex-1 truncate">{phone.name}</span>
                  <span className="text-xs text-zinc-400 shrink-0">{formatRelativeTime(phone.updatedAt)}</span>
                </label>
              ))}
              {recencyOrderedPhones.length === 0 && (
                <p className="text-sm text-zinc-400 px-4 py-6 text-center">Nenhum celular cadastrado ainda.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {!loaded ? null : printablePhones.length === 0 ? (
        <div className="no-print text-center py-16">
          <p className="text-zinc-500 text-sm">
            {phones.length === 0
              ? 'Nenhum celular cadastrado para gerar etiquetas.'
              : 'Nenhuma etiqueta selecionada pra impressão.'}
          </p>
        </div>
      ) : (
        <div className="labels-viewport pb-10 pt-6" ref={viewportRef}>
          {pages.map((pagePhones, pageIndex) => (
            <div
              className="a4-frame"
              key={pageIndex}
              style={{ width: A4_WIDTH_PX * scale, height: A4_HEIGHT_PX * scale }}
            >
              <div
                className="a4-page"
                style={{ transform: `scale(${scale})` }}
                ref={pageIndex === 0 ? pageRef : undefined}
              >
                {pagePhones.map((phone) => (
                  <Label key={phone.id} phone={phone} />
                ))}
                {pageIndex === 0 && (
                  <MarginGuides
                    pageRef={pageRef}
                    margins={margins}
                    onChange={handleMarginChange}
                    min={MARGIN_MIN_CM}
                    max={MARGIN_MAX_CM}
                    locked={isLocked}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
