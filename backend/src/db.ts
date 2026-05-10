import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://chyxultlgupbvhtgkxek.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Using Service Key:', supabaseKey ? 'YES' : 'NO');

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});