'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { usePhones } from '../../lib/phones/storage';
import { Phone } from '../../lib/phones/types';
import { resolveNumberById } from '../../lib/phones/resolve';
import { formatPhoneNumber } from '../../lib/phones/format';
import { RulerSlider } from './RulerSlider';
import { MarginGuides, MarginEdge, PageMargins } from './MarginGuides';
import { finishForCase } from '../../lib/phones/colors';

const COLUMNS = 3;
const ROWS = 7;
const LABELS_PER_PAGE = COLUMNS * ROWS;

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_PX = (A4_WIDTH_MM / 25.4) * 96;
const A4_HEIGHT_PX = (A4_HEIGHT_MM / 25.4) * 96;

const SETTINGS_KEY = 'gestao-celulares:labels-settings:v1';
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
  // Mesma lógica de cor da miniatura: se não tem capinha definida, usa o
  // acabamento automático (derivado do nome+modelo) em vez de cinza neutro,
  // pra bater com a cor mostrada no card da lista principal.
  const borderColor = finishForCase(`${phone.name}-${phone.model}`, phone.caseColor).frame;

  return (
    <div
      className="label-cell"
      style={{ borderColor }}
    >
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
  const { phones, loaded } = usePhones();
  const [margins, setMargins] = useState<PageMargins>(DEFAULT_MARGINS);
  const [gapRowCm, setGapRowCm] = useState(DEFAULT_GAP_CM);
  const [gapColCm, setGapColCm] = useState(DEFAULT_GAP_CM);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const pageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.margins && typeof parsed.margins.top === 'number') {
          setMargins(parsed.margins);
        } else if (typeof parsed.marginCm === 'number') {
          // Configuração antiga (margem única pros 4 lados) — migra em memória.
          const m = parsed.marginCm;
          setMargins({ top: m, right: m, bottom: m, left: m });
        }
        if (typeof parsed.gapRowCm === 'number') setGapRowCm(parsed.gapRowCm);
        else if (typeof parsed.gapCm === 'number') setGapRowCm(parsed.gapCm);
        if (typeof parsed.gapColCm === 'number') setGapColCm(parsed.gapColCm);
        else if (typeof parsed.gapCm === 'number') setGapColCm(parsed.gapCm);
      }
    } catch {
      // ignora configuração corrompida e mantém os padrões
    }
    setSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ margins, gapRowCm, gapColCm }));
  }, [margins, gapRowCm, gapColCm, settingsLoaded]);

  // Escala a folha A4 pra caber inteira na tela (só a pré-visualização — na
  // impressão ela sempre sai em tamanho real, ver @media print abaixo).
  useEffect(() => {
    function recomputeScale() {
      const availableWidth = (viewportRef.current?.clientWidth ?? window.innerWidth) - 32;
      const availableHeight = window.innerHeight - 180;
      const next = Math.min(availableWidth / A4_WIDTH_PX, availableHeight / A4_HEIGHT_PX, 1);
      setScale(next > 0 ? next : 1);
    }
    recomputeScale();
    window.addEventListener('resize', recomputeScale);
    return () => window.removeEventListener('resize', recomputeScale);
  }, []);

  const handleMarginChange = (edge: MarginEdge, value: number) => {
    setMargins((prev) => ({ ...prev, [edge]: value }));
  };

  const sortedPhones = useMemo(
    () => [...phones].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [phones]
  );
  const pages = useMemo(() => chunk(sortedPhones, LABELS_PER_PAGE), [sortedPhones]);

  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }

        .labels-toolbar {
          max-width: 1000px;
          margin: 0 auto;
          padding: 1.5rem 1rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
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
          grid-template-columns: repeat(${COLUMNS}, 1fr);
          grid-template-rows: repeat(${ROWS}, 1fr);
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

        .margin-guides { position: absolute; inset: 0; pointer-events: none; z-index: 5; }
        .margin-guide { position: absolute; pointer-events: auto; }
        .margin-guide-h {
          left: 0;
          right: 0;
          height: 16px;
          margin-top: -8px;
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
          width: 16px;
          margin-left: -8px;
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
          left: 6px;
          top: 50%;
          transform: translateY(-50%);
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-right: 11px solid #2563eb;
        }
        .margin-guide-handle-top {
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 11px solid #2563eb;
        }
        .margin-guide-value {
          position: absolute;
          left: 22px;
          top: 50%;
          transform: translateY(-50%);
          background: #2563eb;
          color: white;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 3px;
          white-space: nowrap;
          font-family: monospace;
        }
        .margin-guide-value-v {
          left: 50%;
          top: 22px;
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
        <div className="labels-toolbar">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <div>
              <h1 className="font-bold text-lg text-slate-900">Etiquetas para impressão</h1>
              <p className="text-xs text-slate-400">
                Folha A4, grade {COLUMNS}x{ROWS} — {sortedPhones.length} celular
                {sortedPhones.length === 1 ? '' : 'es'} em {pages.length || 0} página{pages.length === 1 ? '' : 's'}.
                {' '}
                Arraste as guias azuis na folha pra ajustar as margens.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <RulerSlider
              label="Espaço vertical"
              value={gapRowCm}
              min={GAP_MIN_CM}
              max={GAP_MAX_CM}
              step={0.1}
              onChange={setGapRowCm}
            />
            <RulerSlider
              label="Espaço horizontal"
              value={gapColCm}
              min={GAP_MIN_CM}
              max={GAP_MAX_CM}
              step={0.1}
              onChange={setGapColCm}
            />
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {!loaded ? null : sortedPhones.length === 0 ? (
        <div className="no-print text-center py-20">
          <p className="text-slate-500 text-sm">Nenhum celular cadastrado para gerar etiquetas.</p>
        </div>
      ) : (
        <div className="pb-10" ref={viewportRef}>
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
