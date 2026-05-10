import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

console.log("URL:", supabaseUrl);
// we don't log the key fully for security

async function test() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const fakeBuffer = Buffer.from('hello world');
    
    console.log("Intentando subir archivo...");
    const { data, error } = await supabase.storage
        .from('evidencias')
        .upload('test.txt', fakeBuffer, {
            contentType: 'text/plain',
            upsert: true
        });

    if (error) {
        console.error("ERROR DE SUPABASE:", error);
    } else {
        console.log("EXITO:", data);
    }
}
test();
