import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON!;

// ─── Singleton global ─────────────────────────────────────────────────────────
// Next.js en dev recarga módulos en caliente: sin esto, cada recarga crea un
// nuevo cliente y abre nuevas conexiones, saturando el pool de Supabase.
type SupabaseClient = ReturnType<typeof createClient>;
const g = global as typeof global & { _stockiqSupabase?: SupabaseClient };

function createSupabaseClient(): SupabaseClient {
  return createClient(url, anon, {
    auth: {
      autoRefreshToken:   false,
      persistSession:     false,
      detectSessionInUrl: false,
    },
    realtime: {
      // Reducir frecuencia de heartbeat para no saturar conexiones
      params: { heartbeatIntervalMs: 30_000 },
    },
  });
}

export const supabase: SupabaseClient = g._stockiqSupabase ?? createSupabaseClient();

if (process.env.NODE_ENV !== 'production') {
  g._stockiqSupabase = supabase;
}
