import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://sfuxebkldwvyjsusdupp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdXhlYmtsZHd2eWpzdXNkdXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMDUzODMsImV4cCI6MjEwMjg4MTM4M30.EyNMVW3hX36GXYl6JNsZuh-LyWLVyuI9Zg7k9C2NPJI';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Polyfill WebSocket for Node.js / Expo Static Render (SSR) environments if missing
if (typeof globalThis !== 'undefined' && !(globalThis as any).WebSocket) {
  try {
    (globalThis as any).WebSocket = require('ws');
  } catch (e) {
    class DummyWebSocket {
      constructor() {}
      addEventListener() {}
      removeEventListener() {}
      send() {}
      close() {}
    }
    (globalThis as any).WebSocket = DummyWebSocket;
  }
}

export const isSupabaseConfigured = (): boolean => {
  const configured = Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('placeholder')
  );
  console.log('[Veya Supabase] Config Check:', {
    configured,
    url: SUPABASE_URL,
    hasKey: Boolean(SUPABASE_ANON_KEY),
  });
  return configured;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: typeof window !== 'undefined',
    detectSessionInUrl: false,
  },
});
