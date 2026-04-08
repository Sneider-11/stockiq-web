-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN REQUERIDA — Ejecutar UNA SOLA VEZ en el SQL Editor de Supabase
-- Dashboard: https://supabase.com/dashboard/project/fuupwozvoefwksyeqhgx/sql
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Agrega la columna de contraseña web a la tabla de usuarios
--    (solo se usa en la plataforma web, independiente de la app móvil)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS pass_web TEXT DEFAULT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- LISTO. Después de ejecutar esto:
-- 1. Abre http://localhost:3000/login
-- 2. Ingresa tu cédula
-- 3. Como pass_web es NULL, se te pedirá crear tu contraseña web
-- 4. Crea la contraseña y entras directo al dashboard
-- ═══════════════════════════════════════════════════════════════════════════
