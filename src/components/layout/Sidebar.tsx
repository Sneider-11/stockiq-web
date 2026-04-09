'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Store, User, LogOut,
  ChevronRight, Layers, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/types';

interface NavItem {
  href:  string;
  label: string;
  icon:  React.ReactNode;
  roles?: Array<'SUPERADMIN' | 'ADMIN' | 'CONTADOR'>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',             label: 'Inicio',                icon: <LayoutDashboard size={18} /> },
  { href: '/consolidado',  label: 'Consolidado',           icon: <BarChart3 size={18} />, roles: ['SUPERADMIN', 'ADMIN'] },
  { href: '/equipo',       label: 'Equipo',                icon: <Users  size={18} />, roles: ['SUPERADMIN', 'ADMIN'] },
  { href: '/tiendas',      label: 'Tiendas',               icon: <Store  size={18} />, roles: ['SUPERADMIN'] },
  { href: '/perfil',       label: 'Mi Perfil',             icon: <User   size={18} /> },
];

interface Props {
  user: SessionUser;
}

export function Sidebar({ user }: Props) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    item => !item.roles || item.roles.includes(user.rol),
  );

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <aside className="flex flex-col w-64 h-full bg-zinc-950 border-r border-zinc-800/60 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-zinc-800/60">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-prp to-ind flex items-center justify-center shadow-lg shadow-prp/30">
          <Layers size={16} className="text-white" />
        </div>
        <div>
          <span className="text-sm font-black text-white tracking-tight">StockIQ</span>
          <span className="block text-[10px] text-zinc-500 -mt-0.5">Plataforma Web</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-prp/20 text-white shadow-sm shadow-prp/10 border border-prp/30'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60',
              )}
            >
              <span className={cn(
                'transition-colors',
                isActive ? 'text-vlt' : 'text-zinc-500 group-hover:text-zinc-300',
              )}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} className="text-vlt/60" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-4 border-t border-zinc-800/60 pt-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-zinc-900/60">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-prp to-ind flex items-center justify-center text-white text-xs font-black shrink-0">
            {user.nombre.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-100 truncate">{user.nombre}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{user.rol}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-all duration-150"
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
