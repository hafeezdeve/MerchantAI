import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readSupabaseConfig } from './supabase-config';

const config = readSupabaseConfig(import.meta.env);
export const supabaseConfigurationError = config.error;
// No client or network requests are created until configuration is valid.
export const supabase: SupabaseClient = config.error
  ? new Proxy({} as SupabaseClient, {
      get() { throw new Error(config.error!); },
    })
  : createClient(config.url, config.key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
