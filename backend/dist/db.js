"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = 'https://chyxultlgupbvhtgkxek.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
console.log('Supabase URL:', supabaseUrl);
console.log('Using Service Key:', supabaseKey ? 'YES' : 'NO');
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});
