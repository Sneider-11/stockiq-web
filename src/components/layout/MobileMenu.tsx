'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import {
  X, LayoutDashboard, Users, Store, User,
  LogOut, Layers, Boxes, BarChart3, ChevronRight, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/types';

interface Props {
  user: SessionUser;
  onClose: () => void;
}

const NAV = [
  { href: '/',            label: 'Inicio',             Icon: LayoutDashboard, roles: null },
  { href: '/consolidado', label: 'Consolidado',        Icon: BarChart3,       roles: ['SUPERADMIN', 'ADMIN'] },
  { href: '/grupos',      label: 'Grupos Comerciales', Icon: Building2,       roles: ['SUPERADMIN'] },
  { href: '/equipo',      label: 'Equipo',             Icon: Users,           roles: ['SUPERADMIN', 'ADMIN'] },
  { href: '/tiendas',     label: 'Tiendas',            Icon: Store,           roles: ['SUPERADMIN'] },
  { href: '/perfil',      label: 'Mi Perfil',          Icon: User,            roles: null },
] as const;

export function MobileMenu({ user, onClose }: Props) {
  const pathname = usePathname();
  useEscapeKey(onClose);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const visible = NAV.filter(n => !n.roles || (n.roles as readonly string[]).includes(user.rol));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden anim-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className="fixed inset-y-0 left-0 z-50 w-[90vw] max-w-xs bg-zinc-950 border-r border-zinc-800/60 flex flex-col lg:hidden mobile-drawer-enter shadow-2xl shadow-black/60"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
      >
        {/* Logo + close */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 shrink-0">
              <div className="logo-tile w-8 h-8 rounded-xl bg-gradient-to-br from-prp to-ind flex items-center justify-center overflow-hidden relative">
                <div className="logo-scan" />
                <span className="logo-icon-a absolute inset-0 flex items-center justify-center">
                  <Layers size={16} className="text-white" aria-hidden="true" />
                </span>
                <span className="logo-icon-b absolute inset-0 flex items-center justify-center">
                  <Boxes size={16} className="text-white" aria-hidden="true" />
                </span>
              </div>
              <span className="logo-orbit logo-orbit-1" />
              <span className="logo-orbit logo-orbit-2" />
              <span className="logo-orbit logo-orbit-3" />
            </div>
            <div>
              <div
                id="mobile-menu-title"
                className="text-sm font-black tracking-tight leading-none"
              >
                {'StockIQ'.split('').map((l, i) => (
                  <span key={i} className="logo-letter" style={{ animationDelay: `${i * 0.08}s` }}>{l}</span>
                ))}
              </div>
              <span className="block text-[10px] text-zinc-500 -mt-0.5">Plataforma Web</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visible.map((item, i) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
            const { Icon } = item;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group anim-slide-right',
                  isActive
                    ? 'bg-prp/20 text-white shadow-sm shadow-prp/10 border border-prp/30'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60',
                )}
                style={{ animationDelay: `${i * 50 + 100}ms` }}
              >
                <span className={cn(
                  'transition-colors',
                  isActive ? 'text-vlt' : 'text-zinc-500 group-hover:text-zinc-300',
                )}>
                  <Icon size={18} />
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="text-vlt/60" />}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 pb-5 border-t border-zinc-800/60 pt-3 space-y-1 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/40">
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-all"
          >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
