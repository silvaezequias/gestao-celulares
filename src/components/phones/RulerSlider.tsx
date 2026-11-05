'use client';

import React, { useMemo } from 'react';

interface RulerSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

// Slider estilizado como régua (com marcações), usado pra ajustar margem e
// espaçamento da folha de etiquetas arrastando o cursor.
export const RulerSlider: React.FC<RulerSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = 'cm',
  disabled,
  onChange,
}) => {
  const ticks = useMemo(() => {
    const list: { value: number; major: boolean }[] = [];
    const count = Math.round((max - min) / step);
    for (let i = 0; i <= count; i++) {
      const t = min + i * step;
      const major = Math.abs(Math.round(t) - t) < 1e-6;
      list.push({ value: t, major });
    }
    return list;
  }, [min, max, step]);

  return (
    <div className={`flex flex-col gap-1 w-full max-w-[200px] ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
        <span>{label}</span>
        <span className="font-mono text-zinc-900 font-bold text-xs">
          {value.toFixed(1)}
          {unit}
        </span>
      </div>
      <div className="ruler-wrap relative h-7">
        <div className="absolute inset-x-0 top-3.5 h-px bg-zinc-200" />
        {ticks.map((tick) => (
          <div
            key={tick.value}
            className={`absolute bottom-0 w-px ${tick.major ? 'h-3.5 bg-zinc-400' : 'h-2 bg-zinc-300'}`}
            style={{ left: `${((tick.value - min) / (max - min)) * 100}%` }}
          />
        ))}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="ruler-range absolute inset-0 w-full disabled:cursor-not-allowed"
          aria-label={label}
        />
      </div>
    </div>
  );
};
