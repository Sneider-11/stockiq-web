'use client';

import { useState, useTransition, useEffect } from 'react';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2, Bell, Moon, Globe } from 'lucide-react';

function passwordStrength(pass: string): { level: number; label: string; color: string } {
  if (!pass)           return { level: 0, label: '',           color: '' };
  if (pass.length < 6) return { level: 1, label: 'Débil',      color: '#EF4444' };
  if (pass.length < 9) return { level: 2, label: 'Regular',    color: '#F59E0B' };
  if (pass.length < 12)return { level: 3, label: 'Fuerte',     color: '#10B981' };
  return                      { level: 4, label: 'Muy fuerte', color: '#A78BFA' };
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-gradient-to-r from-prp to-ind' : 'bg-zinc-700'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function PerfilClient() {
  const [isPending, startTransition] = useTransition();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);

  const [notifPush,  setNotifPush]  = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [darkMode,   setDarkMode]   = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('stockiq_prefs');
      if (stored) {
        const p = JSON.parse(stored) as Record<string, boolean>;
        if (typeof p.notifPush  === 'boolean') setNotifPush(p.notifPush);
        if (typeof p.notifEmail === 'boolean') setNotifEmail(p.notifEmail);
        if (typeof p.darkMode   === 'boolean') setDarkMode(p.darkMode);
      }
    } catch { /* ignore */ }
  }, []);

  const togglePref = (key: 'notifPush' | 'notifEmail' | 'darkMode', val: boolean) => {
    const next = { notifPush, notifEmail, darkMode, [key]: val };
    if (key === 'notifPush')  setNotifPush(val);
    if (key === 'notifEmail') setNotifEmail(val);
    if (key === 'darkMode')   setDarkMode(val);
    try { localStorage.setItem('stockiq_prefs', JSON.stringify(next)); } catch { /* ignore */ }
  };

  const strength = passwordStrength(newPass);

  const handleSubmit = () => {
    setError(''); setSuccess(false);
    if (!currentPass || !newPass || !confirmPass) {
      setError('Completa todos los campos.'); return;
    }
    if (newPass.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.'); return;
    }
    if (newPass !== confirmPass) {
      setError('Las contraseñas nuevas no coinciden.'); return;
    }

    startTransition(async () => {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Error al cambiar contraseña.');
      } else {
        setSuccess(true);
        setCurrentPass(''); setNewPass(''); setConfirmPass('');
      }
    });
  };

  return (
    <>
      {/* ── Cambiar contraseña ── */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-6 mt-4 anim-fade-up" style={{ animationDelay: '160ms' }}>
        <h3 className="text-sm font-bold text-zinc-100 mb-5 flex items-center gap-2">
          <Lock size={15} className="text-vlt" />
          Cambiar contraseña
        </h3>

        <div className="space-y-4">
          {/* Contraseña actual */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
              Contraseña actual
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPass}
                onChange={e => setCurrentPass(e.target.value)}
                placeholder="Tu contraseña actual"
                suppressHydrationWarning
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-10 pr-12 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all input-field"
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
              Nueva contraseña
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                suppressHydrationWarning
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-10 pr-12 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all input-field"
              />
              <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {/* Strength bars */}
            {newPass && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(n => (
                    <div
                      key={n}
                      className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: n <= strength.level ? strength.color : '#27272A',
                        boxShadow: n <= strength.level ? `0 0 4px ${strength.color}80` : 'none',
                      }}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-semibold" style={{ color: strength.color }}>{strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirmar */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                placeholder="Repite la contraseña"
                suppressHydrationWarning
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-10 pr-12 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all input-field"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/60 rounded-xl px-4 py-3 anim-fade-up">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-900/60 rounded-xl px-4 py-3 anim-fade-up">
              <CheckCircle size={14} className="text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-400">Contraseña actualizada correctamente.</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full h-10 bg-gradient-to-r from-prp to-ind rounded-xl font-bold text-white text-sm shadow-lg shadow-prp/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 btn-press"
          >
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            {isPending ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
        </div>
      </div>

      {/* ── Preferencias ── */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 overflow-hidden mt-4 mb-6 anim-fade-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800/50 bg-zinc-800/20">
          <Bell size={13} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Preferencias</span>
        </div>
        <div className="divide-y divide-zinc-800/40">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800/60 flex items-center justify-center shrink-0">
                <Bell size={14} className="text-vlt" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Notificaciones push</p>
                <p className="text-[11px] text-zinc-500">Alertas de inventario en tiempo real</p>
              </div>
            </div>
            <Toggle checked={notifPush} onChange={() => togglePref('notifPush', !notifPush)} />
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800/60 flex items-center justify-center shrink-0">
                <Bell size={14} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Notificaciones por email</p>
                <p className="text-[11px] text-zinc-500">Resumen diario de auditorías</p>
              </div>
            </div>
            <Toggle checked={notifEmail} onChange={() => togglePref('notifEmail', !notifEmail)} />
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800/60 flex items-center justify-center shrink-0">
                <Moon size={14} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Modo oscuro</p>
                <p className="text-[11px] text-zinc-500">Tema oscuro activado por defecto</p>
              </div>
            </div>
            <Toggle checked={darkMode} onChange={() => togglePref('darkMode', !darkMode)} />
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800/60 flex items-center justify-center shrink-0">
                <Globe size={14} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Idioma</p>
                <p className="text-[11px] text-zinc-500">Español (Colombia)</p>
              </div>
            </div>
            <span className="text-xs text-zinc-500 bg-zinc-800/60 px-2 py-1 rounded-lg font-mono">ES</span>
          </div>
        </div>
      </div>
    </>
  );
}
