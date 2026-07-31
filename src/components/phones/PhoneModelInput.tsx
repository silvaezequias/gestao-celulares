'use client';

import React, { useMemo, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { ALL_PHONE_MODELS } from '../../lib/phones/models';

interface PhoneModelInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export const PhoneModelInput: React.FC<PhoneModelInputProps> = ({ value, onChange, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    const list = query
      ? ALL_PHONE_MODELS.filter((m) => m.toLowerCase().includes(query))
      : ALL_PHONE_MODELS;
    return list.slice(0, 8);
  }, [value]);

  const selectSuggestion = (model: string) => {
    onChange(model);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 120)}
          onKeyDown={(e) => {
            if (!isOpen || suggestions.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlighted((h) => (h + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              selectSuggestion(suggestions[highlighted]);
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder="Ex: iPhone 14 Pro, Samsung Galaxy S23..."
          autoComplete="off"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1.5 w-full max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg py-1">
          {suggestions.map((model, i) => (
            <li key={model}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(model)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer ${
                  i === highlighted ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {model}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
