'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hash, Smartphone, Tags, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../../lib/phones/store';

const NAV = [
  { href: '/', label: 'Aparelhos', icon: Smartphone },
  { href: '/numeros', label: 'Números', icon: Hash },
  { href: '/etiquetas', label: 'Etiquetas', icon: Tags },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toasts } = useStore();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      <header className="app-chrome sticky top-0 z-30 border-b border-zinc-200/70 bg-[#f6f7f9]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-zinc-900 text-white">
              <Smartphone className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Gestão de Celulares</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full bg-zinc-200/60 p-1 md:flex">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  isActive(href) ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="pb-safe">{children}</main>

      {/* Barra inferior (mobile) */}
      <nav className="app-chrome fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  active ? 'text-zinc-900' : 'text-zinc-400'
                }`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full transition ${active ? 'bg-zinc-900 text-white' : ''}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Avisos */}
      <div className="app-chrome pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="anim-pop flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
          >
            {t.tone === 'ok' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}
