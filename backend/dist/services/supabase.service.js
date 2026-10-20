"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToSupabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
let supabaseClient = null;
function getSupabaseClient() {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseKey)
        return null;
    if (!supabaseClient) {
        supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    return supabaseClient;
}
const uploadFileToSupabase = async (fileName, fileBuffer, mimeType) => {
    try {
        const client = getSupabaseClient();
        if (!client) {
            console.warn("⚠️ URL o Clave de Supabase no registradas en .env. Simulando carga segura...");
            return `https://tu-proyecto.supabase.co/storage/v1/object/public/evidencias/simulado_${Date.now()}_${fileName}`;
        }
        // Sanear el nombre del archivo para que no rompa la URL
        const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const filePath = `${Date.now()}_${safeName}`;
        // Subir al 'Bucket' llamado 'evidencias'
        const { data, error } = await client.storage
            .from('evidencias')
            .upload(filePath, fileBuffer, {
            contentType: mimeType,
            upsert: false
        });
        if (error) {
            throw new Error(`Fallo subiendo archivo a Supabase Storage: ${error.message}`);
        }
        // Generar y retornar el acceso HTTP (Link público del archivo)
        const { data: publicUrlData } = client.storage
            .from('evidencias')
            .getPublicUrl(filePath);
        return publicUrlData.publicUrl;
    }
    catch (error) {
        console.error("[SupabaseService] Error de almacenamiento:", error);
        throw error;
    }
};
exports.uploadFileToSupabase = uploadFileToSupabase;
