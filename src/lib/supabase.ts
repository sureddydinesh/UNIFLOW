import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return String(import.meta.env[key]).trim();
  }
  return '';
};

// Support standard Vite Supabase environment variable naming variations
const rawUrl = getEnvVar('VITE_SUPABASE_URL');
const rawKey =
  getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') ||
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  getEnvVar('VITE_SUPABASE_KEY');

export const supabaseUrl = rawUrl.replace(/\/+$/, '');
export const supabasePublishableKey = rawKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabasePublishableKey !== 'your-supabase-publishable-key' &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabasePublishableKey !== 'placeholder-key'
);

if (!isSupabaseConfigured) {
  console.warn(
    '[UniFlow Supabase] Missing or placeholder VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY.\n' +
    'To configure: Open your Supabase Dashboard -> Project Settings -> API & API Keys, ' +
    'and add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) to your hosting environment variables.'
  );
}

// Fallback placeholder values during build/typecheck when env vars might be undefined
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
