'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al cambiar contraseña.');
      } else {
        setSuccess(true);
        setCurrentPass(''); setNewPass(''); setConfirmPass('');
      }
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-6 mt-4">
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
              className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-10 pr-12 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all"
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
              className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-10 pr-12 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all"
            />
            <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
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
              className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-10 pr-12 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all"
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/60 rounded-xl px-4 py-3">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-900/60 rounded-xl px-4 py-3">
            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-400">Contraseña actualizada correctamente.</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full h-10 bg-gradient-to-r from-prp to-ind rounded-xl font-bold text-white text-sm shadow-lg shadow-prp/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
          {isPending ? 'Guardando…' : 'Actualizar contraseña'}
        </button>
      </div>
    </div>
  );
}
