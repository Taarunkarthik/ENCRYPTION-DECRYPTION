export interface AppRuntimeConfig {
  apiUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

type ResolvedAppRuntimeConfig = Required<AppRuntimeConfig>;

const buildTimeConfig: ResolvedAppRuntimeConfig = {
  apiUrl:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080/api',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

function normalizeValue(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function readRuntimeConfig(): AppRuntimeConfig {
  if (typeof window === 'undefined') {
    return {};
  }

  return window.__APP_CONFIG__ ?? {};
}

export function getRuntimeConfig(): ResolvedAppRuntimeConfig {
  const runtimeConfig = readRuntimeConfig();

  let apiUrl = normalizeValue(runtimeConfig.apiUrl, buildTimeConfig.apiUrl);
  if (apiUrl && !apiUrl.endsWith('/api')) {
    apiUrl = apiUrl.replace(/\/$/, '') + '/api';
  }

  return {
    apiUrl: apiUrl,
    supabaseUrl: normalizeValue(runtimeConfig.supabaseUrl, buildTimeConfig.supabaseUrl),
    supabaseAnonKey: normalizeValue(runtimeConfig.supabaseAnonKey, buildTimeConfig.supabaseAnonKey),
  };
}