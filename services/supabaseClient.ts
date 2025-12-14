import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// We export a singleton client.
// If keys are missing, this remains null, and the app will gracefully fall back to LocalStorage mode.
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Helper to check if we are in "Production/Online" mode
export const isOnlineMode = (): boolean => {
  return !!supabase;
};