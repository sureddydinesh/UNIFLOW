import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_URL : '';
const supabasePublishableKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY : '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabasePublishableKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabasePublishableKey !== 'your-supabase-publishable-key'
);

if (!isSupabaseConfigured) {
  console.warn(
    '[UniFlow Supabase] Missing or placeholder VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY.\n' +
    'To configure: Open your Supabase Dashboard -> Project Settings -> API & API Keys, ' +
    'and add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your .env file.'
  );
}

// Fallback dummy values during build/typecheck when env vars might be undefined
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'uniflow_supabase_auth_token',
    },
  }
);
