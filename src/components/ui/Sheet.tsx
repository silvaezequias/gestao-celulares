'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface SheetProps {
  title?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** no mobile ocupa a tela inteira (formulários) */
  fullOnMobile?: boolean;
}

const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

// Painel que no celular sobe de baixo (bottom sheet) e no desktop vira um
// diálogo centralizado.
export function Sheet({ title, onClose, children, footer, size = 'md', fullOnMobile }: SheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="anim-fade absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`anim-sheet relative flex w-full flex-col overflow-hidden bg-white shadow-2xl sm:rounded-3xl ${SIZES[size]} ${
          fullOnMobile ? 'h-dvh sm:h-auto sm:max-h-[90dvh]' : 'max-h-[92dvh] rounded-t-3xl sm:max-h-[90dvh]'
        }`}
      >
        {!fullOnMobile && <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-zinc-200 sm:hidden" />}
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-3 sm:pt-5">
          <div className="min-w-0 text-[17px] font-semibold tracking-tight">{title}</div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-zinc-100 bg-white px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:pb-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmSheet({
  title,
  message,
  confirmLabel = 'Excluir',
  onConfirm,
  onClose,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Sheet title={title} onClose={onClose} size="sm">
      <p className="text-sm leading-relaxed text-zinc-500">{message}</p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button onClick={onClose} className="btn-secondary">
          Cancelar
        </button>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch {
              setBusy(false);
            }
          }}
          className="btn-danger"
        >
          {busy ? 'Excluindo…' : confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}
