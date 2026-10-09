-- ==========================================
-- SCRIPT DE RESTAURACIÓN DE LECTURA
-- ==========================================
-- Este script crea una política en todas las tablas para permitir 
-- la LECTURA (SELECT) a cualquier persona, restaurando así el 
-- funcionamiento de tu frontend si este consulta datos directamente.
-- 
-- Al mismo tiempo, MANTIENE EL BLOQUEO para INSERT, UPDATE y DELETE,
-- por lo que tu base de datos sigue protegida contra inyecciones maliciosas.
-- ==========================================

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
        AND tablename IN ('Usuario', 'Plan', 'ObjetivoEstrategico', 'Programa', 'Hito', 'Actividad', 'Localidad', 'AsignacionLocalidad', 'SubTarea', 'Evidencia', 'Comentario', 'Alerta', 'CorteMensual', 'ReporteCualitativo', 'FichaAlerta', 'ActualizacionAlerta', 'FichaResultados', 'Reunion', 'AsistenteReunion', 'CompromisoReunion', 'Informe', 'Evento', 'SeguimientoNormativo', 'OtroEspacioArticulacion', 'HistorialChat', 'MigracionPlannERLog', 'HistorialCambios', 'FrenteObra', 'AlertaObra', 'MetadatoObra')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Permitir lectura publica" ON "%I";', t);
        EXECUTE format('CREATE POLICY "Permitir lectura publica" ON "%I" FOR SELECT USING (true);', t);
    END LOOP;
END;
$$;
