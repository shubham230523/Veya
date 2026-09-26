import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

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
  return Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder')
  );
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: typeof window !== 'undefined',
    detectSessionInUrl: false,
  },
});
