#!/bin/sh
set -eu

api_url="${VITE_API_URL:-${VITE_API_BASE_URL:-${APP_API_URL:-http://localhost:8080/api}}}"
supabase_url="${VITE_SUPABASE_URL:-${APP_SUPABASE_URL:-}}"
supabase_anon_key="${VITE_SUPABASE_ANON_KEY:-${APP_SUPABASE_ANON_KEY:-}}"

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__APP_CONFIG__ = {
  apiUrl: "${api_url}",
  supabaseUrl: "${supabase_url}",
  supabaseAnonKey: "${supabase_anon_key}"
};
EOF