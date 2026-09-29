-- ==========================================
-- SCRIPT DE SEGURIDAD SUPABASE PARA PRISMA
-- ==========================================
-- Como estás utilizando Prisma (backend) para gestionar la base de datos, 
-- tus consultas se hacen con permisos de administrador que saltan el RLS.
-- 
-- El objetivo de este script es ACTIVAR RLS en todas las tablas para 
-- BLOQUEAR el acceso público a través de las APIs (REST/GraphQL) que 
-- Supabase genera automáticamente. 
--
-- Al no crear políticas de acceso público, nadie podrá usar la "anon key" 
-- de tu proyecto para inyectar datos o leerlos desde afuera, eliminando 
-- así el riesgo de inyección maliciosa en el lado del cliente.
-- ==========================================

ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ObjetivoEstrategico" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Programa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Hito" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Actividad" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Localidad" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AsignacionLocalidad" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubTarea" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Evidencia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comentario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Alerta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CorteMensual" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReporteCualitativo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FichaAlerta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActualizacionAlerta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FichaResultados" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reunion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AsistenteReunion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompromisoReunion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Informe" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Evento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeguimientoNormativo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OtroEspacioArticulacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HistorialChat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MigracionPlannERLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HistorialCambios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FrenteObra" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AlertaObra" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MetadatoObra" ENABLE ROW LEVEL SECURITY;

-- Nota: No creamos comandos "CREATE POLICY" a propósito. 
-- Al dejar las tablas con RLS activado y sin políticas, se bloquea por 
-- defecto cualquier intento de lectura, escritura o borrado desde el 
-- exterior (Internet) usando el anon key. Tu app con Prisma seguirá 
-- funcionando perfecto porque se conecta directamente a la base de datos.
