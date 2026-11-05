import React, { memo, useId } from 'react';
import { BackShape, DeviceSpec, bodyColorFor, luminance, mix, resolveDevice } from '../../lib/phones/devices';

export type DeviceView = 'front' | 'back';

interface DeviceThumbProps {
  model: string;
  seed?: string;
  caseColor?: string;
  view?: DeviceView;
  /** largura em px; a altura é sempre o dobro */
  width?: number;
  className?: string;
}

const W = 100;
const H = 200;

// Miniatura vetorial do aparelho. Todo o desenho sai de devices.ts, então
// adicionar um modelo novo é só cadastrar uma regra/especificação lá.
export const DeviceThumb = memo(function DeviceThumb({
  model,
  seed,
  caseColor,
  view = 'back',
  width = 56,
  className,
}: DeviceThumbProps) {
  const spec = resolveDevice(model);
  const body = bodyColorFor(seed ?? model, caseColor);
  const isLight = luminance(body) > 0.45;
  const uid = useId().replace(/[:«»]/g, '');

  const edge = isLight ? mix(body, '#000000', 0.18) : mix(body, '#ffffff', 0.16);
  const hi = mix(body, '#ffffff', isLight ? 0.55 : 0.22);
  const lo = mix(body, '#000000', isLight ? 0.08 : 0.25);

  return (
    <svg
      viewBox={`-3 -1 ${W + 6} ${H + 2}`}
      width={width}
      height={width * 2}
      className={className}
      role="img"
      aria-label={`${view === 'front' ? 'Frente' : 'Verso'} do ${model || 'aparelho'}`}
    >
      <defs>
        <linearGradient id={`b${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={hi} />
          <stop offset="0.55" stopColor={body} />
          <stop offset="1" stopColor={lo} />
        </linearGradient>
        <linearGradient id={`s${uid}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={mix(body, '#0b1020', 0.45)} />
          <stop offset="0.6" stopColor={mix(body, '#0b1020', 0.8)} />
          <stop offset="1" stopColor="#070a12" />
        </linearGradient>
        <radialGradient id={`g${uid}`} cx="0.35" cy="0.35" r="0.65">
          <stop offset="0" stopColor="#3a4150" />
          <stop offset="0.6" stopColor="#11141b" />
          <stop offset="1" stopColor="#05070b" />
        </radialGradient>
      </defs>

      {/* Botões laterais */}
      <rect x={-2} y={40} width={3} height={14} rx={1.5} fill={edge} />
      <rect x={-2} y={60} width={3} height={22} rx={1.5} fill={edge} />
      <rect x={W - 1} y={52} width={3} height={28} rx={1.5} fill={edge} />

      {/* Corpo */}
      <rect x={0} y={0} width={W} height={H} rx={spec.radius} fill={`url(#b${uid})`} />
      <rect
        x={0.6}
        y={0.6}
        width={W - 1.2}
        height={H - 1.2}
        rx={spec.radius - 0.6}
        fill="none"
        stroke={edge}
        strokeWidth={1.2}
      />

      {view === 'front' ? (
        <Front spec={spec} uid={uid} isLight={isLight} />
      ) : (
        <Back spec={spec} uid={uid} body={body} isLight={isLight} />
      )}
    </svg>
  );
});

function Front({ spec, uid, isLight }: { spec: DeviceSpec; uid: string; isLight: boolean }) {
  const inset = 3.2;
  const thick = spec.front === 'home' || spec.front === 'bezel';
  const top = spec.front === 'home' ? 26 : spec.front === 'bezel' ? 17 : inset;
  const bottom = spec.front === 'home' ? 26 : spec.front === 'bezel' ? 15 : inset;
  const r = thick ? 2 : spec.radius - inset;
  const sx = inset;
  const sw = W - inset * 2;
  const sh = H - top - bottom;
  const bezelMark = isLight ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.22)';

  return (
    <g>
      {/* moldura preta da tela */}
      {!thick && <rect x={1.6} y={1.6} width={W - 3.2} height={H - 3.2} rx={spec.radius - 1.6} fill="#06080c" />}
      <rect x={sx} y={top} width={sw} height={sh} rx={r} fill={`url(#s${uid})`} />
      {/* reflexo sutil */}
      <path
        d={`M${sx + 8} ${top} L${sx + sw * 0.62} ${top} L${sx + 8} ${top + sh * 0.55} Z`}
        fill="#ffffff"
        opacity={0.05}
      />
      {/* relógio da tela de bloqueio */}
      <rect x={34} y={top + 22} width={32} height={9} rx={4.5} fill="#ffffff" opacity={0.85} />
      <rect x={40} y={top + 35} width={20} height={3} rx={1.5} fill="#ffffff" opacity={0.4} />

      {spec.front === 'island' && <rect x={38} y={6.5} width={24} height={7} rx={3.5} fill="#000" />}
      {spec.front === 'notch' && (
        <path d="M32 3.2 h36 v3.5 a5 5 0 0 1 -5 5 h-26 a5 5 0 0 1 -5 -5 Z" fill="#06080c" />
      )}
      {spec.front === 'punch' && <circle cx={50} cy={9.5} r={2.8} fill="#000" />}
      {spec.front === 'drop' && <path d="M45 3.2 h10 a5 5 0 0 1 -5 6.2 a5 5 0 0 1 -5 -6.2 Z" fill="#06080c" />}
      {thick && (
        <>
          <rect x={40} y={spec.front === 'home' ? 12 : 8} width={20} height={2.4} rx={1.2} fill={bezelMark} />
          <circle cx={spec.front === 'home' ? 30 : 32} cy={spec.front === 'home' ? 13.2 : 9.2} r={1.8} fill={bezelMark} />
        </>
      )}
      {spec.front === 'home' && <circle cx={50} cy={187} r={7} fill="none" stroke={bezelMark} strokeWidth={1.4} />}
      {!thick && <rect x={38} y={H - 9} width={24} height={2} rx={1} fill="#ffffff" opacity={0.45} />}
    </g>
  );
}

function Back({ spec, uid, body, isLight }: { spec: DeviceSpec; uid: string; body: string; isLight: boolean }) {
  const moduleFill = isLight ? mix(body, '#000000', 0.1) : mix(body, '#ffffff', 0.08);
  const moduleStroke = isLight ? mix(body, '#000000', 0.2) : mix(body, '#ffffff', 0.18);
  const mark = isLight ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.38)';

  const render = (s: BackShape, i: number) => {
    switch (s.t) {
      case 'module':
        return (
          <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} fill={moduleFill} stroke={moduleStroke} strokeWidth={0.8} />
        );
      case 'ring':
        return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={moduleFill} stroke={moduleStroke} strokeWidth={1} />;
      case 'lens':
        return (
          <g key={i}>
            {s.ring && <circle cx={s.cx} cy={s.cy} r={s.r + 1.6} fill={moduleFill} stroke={moduleStroke} strokeWidth={0.8} />}
            <circle cx={s.cx} cy={s.cy} r={s.r} fill="#0d0f14" />
            <circle cx={s.cx} cy={s.cy} r={s.r * 0.72} fill={`url(#g${uid})`} />
            <circle cx={s.cx} cy={s.cy} r={s.r * 0.3} fill="#06080c" />
            <circle cx={s.cx - s.r * 0.28} cy={s.cy - s.r * 0.3} r={s.r * 0.14} fill="#ffffff" opacity={0.55} />
          </g>
        );
      case 'flash':
        return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#f4ecd2" stroke="rgba(0,0,0,0.2)" strokeWidth={0.4} />;
      case 'dot':
        return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#14171d" />;
      case 'logo':
        return <Logo key={i} kind={s.kind} color={mark} />;
      case 'text':
        return (
          <text
            key={i}
            x={s.x ?? 50}
            y={s.y}
            textAnchor={s.anchor ?? 'middle'}
            fontSize={s.size ?? 5.5}
            fontWeight={700}
            letterSpacing={s.text.length > 4 ? 0.8 : 0.3}
            fill={mark}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {s.text}
          </text>
        );
    }
  };

  return <g>{spec.back.map(render)}</g>;
}

function Logo({ kind, color }: { kind: 'apple' | 'moto' | 'google'; color: string }) {
  if (kind === 'apple') {
    return (
      <g transform="translate(50 100)" fill={color}>
        <path d="M0 -6.5 c2.6 -2.2 6.8 -1.6 8 1.4 c-2.6 1.4 -2.4 5.4 0.4 6.4 c-1 2.8 -3 5.6 -4.6 5.6 c-1.4 0 -1.8 -0.8 -3.8 -0.8 s-2.6 0.8 -3.8 0.8 c-2 0 -5.8 -4.8 -5.8 -9.4 c0 -5.2 4.6 -6.6 7 -5 c0.9 0.5 1.8 0.6 2.6 1 Z" />
        <path d="M0.4 -7.6 c0 -2.4 1.8 -4 3.6 -4.2 c0.2 2.4 -1.6 4.2 -3.6 4.2 Z" />
      </g>
    );
  }
  if (kind === 'moto') {
    return (
      <g transform="translate(50 100)">
        <circle r={7.5} fill="none" stroke={color} strokeWidth={1.2} />
        <path d="M-4.6 3 L-2.4 -3.6 L0 1 L2.4 -3.6 L4.6 3" fill="none" stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
      </g>
    );
  }
  return (
    <text x={50} y={176} textAnchor="middle" fontSize={9} fontWeight={700} fill={color} fontFamily="ui-sans-serif, system-ui">
      G
    </text>
  );
}

// Frente e verso sobrepostos — usado nos cards e no detalhe.
export function DevicePair({
  model,
  seed,
  caseColor,
  width = 48,
  className,
}: Omit<DeviceThumbProps, 'view'>) {
  return (
    <div className={`relative shrink-0 ${className ?? ''}`} style={{ width: width * 1.55, height: width * 2 + 4 }}>
      <DeviceThumb model={model} seed={seed} caseColor={caseColor} view="front" width={width} className="absolute left-0 top-1 drop-shadow-sm" />
      <DeviceThumb
        model={model}
        seed={seed}
        caseColor={caseColor}
        view="back"
        width={width}
        className="absolute right-0 top-0 drop-shadow-md"
      />
    </div>
  );
}
