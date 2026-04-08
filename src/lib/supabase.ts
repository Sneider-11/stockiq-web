import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON!;

// Cliente Supabase — usado tanto en Server como en Client Components.
// Para operaciones de escritura con privilegios elevados, se necesitaría
// la service_role key (nunca exponer en el cliente).
export const supabase = createClient(url, anon, {
  auth: {
    autoRefreshToken: false,
    persistSession:   false,
    detectSessionInUrl: false,
  },
});
