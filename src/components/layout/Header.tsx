'use client';

import { Bell, Menu } from 'lucide-react';
import type { SessionUser } from '@/types';

interface Props {
  user: SessionUser;
  title?: string;
}

export function Header({ user, title }: Props) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-3">
        <button className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
          <Menu size={20} />
        </button>
        {title && (
          <h1 className="text-base font-semibold text-zinc-100">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-prp to-ind flex items-center justify-center text-white text-xs font-black">
            {user.nombre.charAt(0)}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-zinc-100 leading-tight">{user.nombre}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide leading-tight">{user.rol}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
