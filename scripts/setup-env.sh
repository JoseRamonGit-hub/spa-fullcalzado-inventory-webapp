#!/bin/bash
# Extracts local Supabase anon key into .env.development.
# API URL is derived at runtime from window.location.hostname (see src/lib/supabase.ts).
set -eo pipefail

npx supabase status -o env 2>/dev/null \
  | grep '^PUBLISHABLE_KEY=' \
  | sed 's/^PUBLISHABLE_KEY/VITE_SUPABASE_ANON_KEY/' \
  > .env.development || true
