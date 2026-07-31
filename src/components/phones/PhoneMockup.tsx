import React from 'react';
import { detectBrand } from '../../lib/phones/types';
import { finishForCase } from '../../lib/phones/colors';

export type PhoneMockupView = 'front' | 'back';

interface PhoneMockupProps {
  model: string;
  seedKey?: string;
  caseColor?: string;
  view?: PhoneMockupView;
  size?: number;
  className?: string;
}

const APP_ICON_COLORS = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c'];

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  model,
  seedKey,
  caseColor,
  view = 'front',
  size = 88,
  className,
}) => {
  const brand = detectBrand(model || '');
  const isClassic = /\bse\b/i.test(model || '');
  const isVerticalCamera = /redmi|poco/i.test(model || '');
  const finish = finishForCase(seedKey || model || 'default', caseColor);
  const width = size;
  const height = Math.round(size * 2.02);
  const uid = React.useId().replace(/[:]/g, '');

  return (
    <svg
      viewBox="0 0 120 240"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={`Miniatura (${view === 'front' ? 'frente' : 'verso'}) do aparelho ${model || 'sem modelo'}`}
    >
      <defs>
        <linearGradient id={`frame-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={finish.frameLight} />
          <stop offset="100%" stopColor={finish.frame} />
        </linearGradient>
        <linearGradient id={`screen-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b2233" />
          <stop offset="100%" stopColor="#0a0d15" />
        </linearGradient>
        <linearGradient id={`back-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={finish.frameLight} />
          <stop offset="100%" stopColor={finish.frame} />
        </linearGradient>
      </defs>

      {/* Corpo / frame do aparelho */}
      <rect
        x={3}
        y={3}
        width={114}
        height={234}
        rx={brand === 'apple' ? 26 : 20}
        fill={`url(#frame-${uid})`}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={1}
      />

      {/* Botões laterais */}
      <rect x={0} y={54} width={2.5} height={16} rx={1.25} fill={finish.frame} />
      <rect x={0} y={78} width={2.5} height={26} rx={1.25} fill={finish.frame} />
      <rect x={117.5} y={64} width={2.5} height={30} rx={1.25} fill={finish.frame} />

      {view === 'front' ? (
        <>
          {/* Tela */}
          <rect
            x={9}
            y={isClassic ? 18 : 10}
            width={102}
            height={isClassic ? 190 : 220}
            rx={brand === 'apple' ? 18 : 14}
            fill={`url(#screen-${uid})`}
          />

          {/* Ícones de app na tela, só decorativo */}
          {!isClassic &&
            Array.from({ length: 6 }).map((_, i) => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              const x = 20 + col * 28;
              const y = 40 + row * 28;
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={14}
                  height={14}
                  rx={4}
                  fill={APP_ICON_COLORS[(i + finish.name.length) % APP_ICON_COLORS.length]}
                  opacity={0.85}
                />
              );
            })}

          {isClassic ? (
            // Botão físico "home" clássico
            <circle cx={60} cy={216} r={11} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
          ) : brand === 'apple' ? (
            // Dynamic Island / notch
            <rect x={44} y={16} width={32} height={9} rx={4.5} fill="#000" />
          ) : (
            // Câmera punch-hole
            <circle cx={60} cy={20} r={3.4} fill="#000" />
          )}

          {!isClassic && (
            // Barra indicadora de gestos
            <rect x={45} y={222} width={30} height={3} rx={1.5} fill="rgba(255,255,255,0.35)" />
          )}
        </>
      ) : (
        <>
          {/* Placa traseira */}
          <rect
            x={9}
            y={10}
            width={102}
            height={220}
            rx={brand === 'apple' ? 18 : 14}
            fill={`url(#back-${uid})`}
          />

          {brand === 'apple' ? (
            <>
              {/* Módulo de câmera estilo iPhone: bloco arredondado no canto,
                  lentes em L (triângulo) com margem simétrica nas 4 bordas */}
              <rect x={14} y={16} width={42} height={42} rx={12} fill="rgba(0,0,0,0.35)" />
              <circle cx={27} cy={29} r={7} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <circle cx={43} cy={29} r={7} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <circle cx={27} cy={45} r={7} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <circle cx={43} cy={45} r={3} fill="#d8d8d8" opacity={0.7} />
            </>
          ) : brand === 'xiaomi' && isVerticalCamera ? (
            <>
              {/* Redmi/Poco: muitos modelos dessa linha usam uma tira
                  vertical comprida com 3 lentes grandes enfileiradas + flash,
                  bem diferente do bloco quadrado da Apple */}
              <rect
                x={13}
                y={15}
                width={30}
                height={98}
                rx={15}
                fill="rgba(0,0,0,0.35)"
                stroke={finish.frameLight}
                strokeWidth={1}
                strokeOpacity={0.4}
              />
              <circle cx={28} cy={33} r={11} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
              <circle cx={28} cy={33} r={5.5} fill="#0a0d15" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
              <circle cx={28} cy={62} r={11} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
              <circle cx={28} cy={62} r={5.5} fill="#0a0d15" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
              <circle cx={28} cy={91} r={11} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
              <circle cx={28} cy={91} r={5.5} fill="#0a0d15" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
              <circle cx={28} cy={106} r={3.5} fill="#d8d8d8" opacity={0.8} />
            </>
          ) : brand === 'xiaomi' ? (
            <>
              {/* Xiaomi numerada (flagship): módulo grande, grade 2x2 de
                  4 lentes bem maiores que as do iPhone, sem o "L" triangular */}
              <rect
                x={9}
                y={13}
                width={58}
                height={58}
                rx={17}
                fill="rgba(0,0,0,0.35)"
                stroke={finish.frameLight}
                strokeWidth={1}
                strokeOpacity={0.4}
              />
              <circle cx={27} cy={31} r={10} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
              <circle cx={49} cy={31} r={10} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
              <circle cx={27} cy={53} r={10} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
              <circle cx={49} cy={53} r={10} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
              <circle cx={27} cy={31} r={4.5} fill="#0a0d15" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
              <circle cx={49} cy={53} r={2.2} fill="#d8d8d8" opacity={0.8} />
            </>
          ) : brand === 'lg' ? (
            <>
              {/* LG: lentes centralizadas no topo (não no canto) e leitor de
                  digital circular centralizado logo abaixo — layout bem
                  diferente do módulo/bloco no canto usado pelas outras marcas */}
              <circle cx={52} cy={30} r={7} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <circle cx={68} cy={30} r={7} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <circle cx={60} cy={44} r={2.6} fill="#d8d8d8" opacity={0.7} />
              <circle cx={60} cy={62} r={13} fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
              <circle cx={60} cy={62} r={7} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
            </>
          ) : (
            <>
              {/* Lentes soltas estilo Android genérico, em coluna no canto */}
              <circle cx={30} cy={26} r={8} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <circle cx={30} cy={44} r={8} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <circle cx={30} cy={62} r={6} fill="#12141a" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <circle cx={44} cy={62} r={3} fill="#d8d8d8" opacity={0.7} />
            </>
          )}
        </>
      )}
    </svg>
  );
};
