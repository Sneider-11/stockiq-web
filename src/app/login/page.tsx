'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Layers, AlertCircle, Lock, User } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

type Step = 'login' | 'setup';

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Login state ────────────────────────────────────────────────────────────
  const [cedula,   setCedula]   = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');

  // ── Setup password state ───────────────────────────────────────────────────
  const [step,        setStep]        = useState<Step>('login');
  const [setupUserId, setSetupUserId] = useState('');
  const [setupNombre, setSetupNombre] = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLogin = () => {
    if (!cedula.trim() || !password) {
      setError('Ingresa tu cédula y contraseña.');
      return;
    }
    setError('');

    startTransition(async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: cedula.trim(), password }),
      });
      const data = await res.json();

      if (data.requireSetup) {
        setSetupUserId(data.userId);
        setSetupNombre(data.nombre);
        setStep('setup');
        return;
      }
      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar sesión.');
        return;
      }
      router.push('/');
      router.refresh();
    });
  };

  const handleSetup = () => {
    if (newPass.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPass !== confirmPass) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');

    startTransition(async () => {
      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: setupUserId, cedula: cedula.trim(), newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al guardar la contraseña.');
        return;
      }
      router.push('/');
      router.refresh();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') step === 'login' ? handleLogin() : handleSetup();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-spc flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-prp/8 blur-[120px]" />
        <div className="absolute top-2/3 left-1/3 w-[300px] h-[300px] rounded-full bg-ind/6 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-prp to-ind flex items-center justify-center shadow-2xl shadow-prp/40 mb-4">
            <Layers size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">StockIQ</h1>
          <p className="text-sm text-zinc-500 mt-1">Plataforma de Auditoría</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Specular highlight */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-600/40 to-transparent" />

          <div className="p-8">
            {step === 'login' ? (
              <>
                <h2 className="text-lg font-bold text-zinc-100 mb-1">Iniciar sesión</h2>
                <p className="text-sm text-zinc-500 mb-6">Ingresa con tu cédula y contraseña web</p>

                {/* Cédula */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                    Cédula
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cedula}
                      onChange={e => setCedula(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ej: 1004807039"
                      suppressHydrationWarning
                      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Tu contraseña web"
                      suppressHydrationWarning
                      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-10 pr-12 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/60 rounded-xl px-3 py-2.5 mb-4">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleLogin}
                  disabled={isPending}
                  className="w-full h-12 bg-gradient-to-r from-prp to-ind rounded-xl font-bold text-white text-sm shadow-lg shadow-prp/30 hover:shadow-prp/50 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending ? <Spinner className="text-white" /> : 'Ingresar'}
                </button>
              </>
            ) : (
              <>
                {/* Setup password */}
                <div className="flex items-center gap-2 bg-prp/10 border border-prp/30 rounded-xl px-3 py-2.5 mb-5">
                  <AlertCircle size={14} className="text-vlt shrink-0" />
                  <p className="text-xs text-vlt">
                    Bienvenido, <strong>{setupNombre}</strong>. Es tu primera vez. Crea tu contraseña web.
                  </p>
                </div>

                <h2 className="text-lg font-bold text-zinc-100 mb-1">Crear contraseña web</h2>
                <p className="text-sm text-zinc-500 mb-6">Esta contraseña es exclusiva para la plataforma web.</p>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-10 pr-12 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all"
                    />
                    <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPass}
                      onChange={e => setConfirmPass(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Repite la contraseña"
                      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-10 pr-12 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all"
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/60 rounded-xl px-3 py-2.5 mb-4">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSetup}
                  disabled={isPending}
                  className="w-full h-12 bg-gradient-to-r from-prp to-ind rounded-xl font-bold text-white text-sm shadow-lg shadow-prp/30 hover:shadow-prp/50 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending ? <Spinner className="text-white" /> : 'Guardar y entrar'}
                </button>

                <button onClick={() => { setStep('login'); setError(''); }} className="w-full mt-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  ← Volver al login
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-700 mt-6">
          StockIQ - Grupo Orvion Tech · 2026
        </p>
      </div>
    </div>
  );
}
