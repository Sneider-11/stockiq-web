'use client';

import { useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import { MobileMenu } from './MobileMenu';
import type { SessionUser } from '@/types';

interface Props {
  user: SessionUser;
  title?: string;
}

export function Header({ user, title }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md shrink-0 z-30 relative">
        <div className="flex items-center gap-3 anim-slide-right" style={{ animationDelay: '40ms' }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all active:scale-95 btn-press"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          {title && (
            <h1 className="text-base font-semibold text-zinc-100">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-3 anim-slide-left" style={{ animationDelay: '60ms' }}>
          <button
            className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all btn-press"
            aria-label="Notificaciones"
          >
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-prp to-ind flex items-center justify-center text-white text-xs font-black ring-2 ring-prp/20 hover:ring-prp/40 hover:scale-105 transition-all duration-200 cursor-default">
              {user.nombre.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-zinc-100 leading-tight">{user.nombre}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide leading-tight">{user.rol}</p>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <MobileMenu user={user} onClose={() => setMobileOpen(false)} />
      )}
    </>
  );
}
