import { createClient } from '@supabase/supabase-js';
import { getRuntimeConfig } from '../config/runtimeConfig';

const { supabaseUrl, supabaseAnonKey } = getRuntimeConfig();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase configuration is missing! Check runtime-config.js or your .env file.');
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
