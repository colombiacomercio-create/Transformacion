const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en backend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Cambia esto si tus archivos están en otro bucket, por ejemplo 'actas'
const BUCKET_NAME = 'evidencias'; 

async function descargarArchivos() {
  // Crear carpeta en Descargas
  const downloadsPath = path.join(process.env.USERPROFILE, 'Downloads', `Backup_Archivos_${new Date().toISOString().slice(0,10)}`);
  if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath, { recursive: true });
  }

  console.log(`Buscando archivos en el bucket '${BUCKET_NAME}' de Supabase...`);

  // 1. Obtener lista de todos los archivos
  const { data: list, error: listError } = await supabase.storage.from(BUCKET_NAME).list();

  if (listError) {
    console.error("Error al listar archivos:", listError.message);
    return;
  }

  if (!list || list.length === 0) {
    console.log("No se encontraron archivos para descargar.");
    return;
  }

  console.log(`Se encontraron ${list.length} archivos. Iniciando descarga a: ${downloadsPath}`);

  // 2. Descargar cada archivo
  let descargados = 0;
  for (const file of list) {
    // Evitar intentar descargar la carpeta vacía que genera Supabase
    if (file.name === '.emptyFolderPlaceholder') continue; 
    
    try {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).download(file.name);
      
      if (error) {
        console.error(`Error descargando ${file.name}:`, error.message);
        continue;
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      fs.writeFileSync(path.join(downloadsPath, file.name), buffer);
      
      descargados++;
      console.log(`[${descargados}/${list.length}] Descargado: ${file.name}`);
    } catch (err) {
      console.error(`Excepción descargando ${file.name}:`, err.message);
    }
  }

  console.log(`¡Proceso terminado! Se han guardado ${descargados} archivos en tu computadora.`);
}

descargarArchivos();
