import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://exyswnijklijufwwvklf.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eXN3bmlqa2xpanVmd3d2a2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTgxMjYsImV4cCI6MjA4ODI3NDEyNn0.eB_QG3KcAib5Qb-e8H1RGl_-K7Crk-DZvdqbs-4O1o0'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env")
}

// Generate or retrieve a unique ID for this tab session to ensure truly isolated multi-account support.
// sessionStorage is unique per tab, providing isolation from other tabs.
let tabId = typeof window !== 'undefined' ? window.sessionStorage.getItem('itda-tab-id') : null;
if (typeof window !== 'undefined' && !tabId) {
  tabId = Math.random().toString(36).substring(2, 11);
  window.sessionStorage.setItem('itda-tab-id', tabId);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    storageKey: tabId ? `itda-auth-${tabId}` : 'itda-auth-default',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (...args) => globalThis.fetch(...args)
  },
  db: {
    schema: 'public'
  }
})
