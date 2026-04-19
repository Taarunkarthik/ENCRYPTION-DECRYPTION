import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase environment variables are missing! Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Disable navigator locks to prevent the "NavigatorLockAcquireTimeoutError"
    // which happens when multiple tabs or concurrent requests compete for the same storage lock.
    storageKey: `sb-${supabaseUrl.split('.')[0].split('//')[1]}-auth-token`,
    flowType: 'pkce'
  }
});
