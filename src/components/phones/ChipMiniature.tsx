import React from 'react';

interface ChipMiniatureProps {
  size?: number;
  className?: string;
}

// Miniatura de um chip/SIM físico: corpo com o canto cortado (formato
// clássico de SIM) e contato dourado com a grade de pinos.
export const ChipMiniature: React.FC<ChipMiniatureProps> = ({ size = 40, className }) => (
  <svg viewBox="0 0 44 44" width={size} height={size} className={className} role="img" aria-label="Miniatura do chip">
    <path
      d="M8 2 H32 L42 12 V36 a6 6 0 0 1 -6 6 H8 a6 6 0 0 1 -6 -6 V8 a6 6 0 0 1 6 -6 Z"
      fill="#e2e8f0"
      stroke="#94a3b8"
      strokeWidth="1.5"
    />
    <rect x="10" y="16" width="24" height="16" rx="2.5" fill="#d9b65b" stroke="#a8842f" strokeWidth="1" />
    <line x1="18" y1="16" x2="18" y2="32" stroke="#a8842f" strokeWidth="1" />
    <line x1="26" y1="16" x2="26" y2="32" stroke="#a8842f" strokeWidth="1" />
    <line x1="10" y1="24" x2="34" y2="24" stroke="#a8842f" strokeWidth="1" />
  </svg>
);
