'use client';

import React from 'react';

export type MarginEdge = 'top' | 'right' | 'bottom' | 'left';
export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const PAGE_WIDTH_CM = 21;
const PAGE_HEIGHT_CM = 29.7;

interface MarginGuidesProps {
  pageRef: React.RefObject<HTMLDivElement | null>;
  margins: PageMargins;
  onChange: (edge: MarginEdge, valueCm: number) => void;
  min: number;
  max: number;
  locked?: boolean;
}

// Guias azuis arrastáveis sobre a própria folha (como réguas de layout em
// editores gráficos) — arrasta a linha pra dentro/fora pra ajustar a margem
// daquele lado. Quando "locked" (preset de medida fixa ativo), as guias
// ficam só decorativas, sem poder arrastar.
export const MarginGuides: React.FC<MarginGuidesProps> = ({ pageRef, margins, onChange, min, max, locked }) => {
  const startDrag = (edge: MarginEdge) => (e: React.PointerEvent) => {
    if (locked) return;
    e.preventDefault();
    e.stopPropagation();
    const page = pageRef.current;
    if (!page) return;
    const rect = page.getBoundingClientRect();
    const isHorizontal = edge === 'top' || edge === 'bottom';
    const totalCm = isHorizontal ? PAGE_HEIGHT_CM : PAGE_WIDTH_CM;

    const handleMove = (moveEvent: PointerEvent) => {
      const px = isHorizontal ? moveEvent.clientY - rect.top : moveEvent.clientX - rect.left;
      const size = isHorizontal ? rect.height : rect.width;
      let cm = (px / size) * totalCm;
      if (edge === 'bottom' || edge === 'right') cm = totalCm - cm;
      cm = Math.min(max, Math.max(min, cm));
      onChange(edge, Math.round(cm * 10) / 10);
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div className={`no-print margin-guides ${locked ? 'margin-guides-locked' : ''}`}>
      <div
        className="margin-guide margin-guide-h"
        style={{ top: `${(margins.top / PAGE_HEIGHT_CM) * 100}%` }}
        onPointerDown={startDrag('top')}
      >
        <span className="margin-guide-handle margin-guide-handle-left" />
        <span className="margin-guide-value">{margins.top.toFixed(1)}cm</span>
      </div>

      <div
        className="margin-guide margin-guide-h"
        style={{ top: `${100 - (margins.bottom / PAGE_HEIGHT_CM) * 100}%` }}
        onPointerDown={startDrag('bottom')}
      >
        <span className="margin-guide-handle margin-guide-handle-left" />
        <span className="margin-guide-value">{margins.bottom.toFixed(1)}cm</span>
      </div>

      <div
        className="margin-guide margin-guide-v"
        style={{ left: `${(margins.left / PAGE_WIDTH_CM) * 100}%` }}
        onPointerDown={startDrag('left')}
      >
        <span className="margin-guide-handle margin-guide-handle-top" />
        <span className="margin-guide-value margin-guide-value-v">{margins.left.toFixed(1)}cm</span>
      </div>

      <div
        className="margin-guide margin-guide-v"
        style={{ left: `${100 - (margins.right / PAGE_WIDTH_CM) * 100}%` }}
        onPointerDown={startDrag('right')}
      >
        <span className="margin-guide-handle margin-guide-handle-top" />
        <span className="margin-guide-value margin-guide-value-v">{margins.right.toFixed(1)}cm</span>
      </div>
    </div>
  );
};
