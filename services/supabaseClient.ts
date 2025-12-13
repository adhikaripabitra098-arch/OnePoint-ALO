import { createClient } from '@supabase/supabase-js';

// Keys removed for security as requested.
// You can configure these in your environment variables later.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);