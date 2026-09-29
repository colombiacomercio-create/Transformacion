-- ==========================================
-- SCRIPT DIRECTO PARA RESTAURAR LECTURA
-- ==========================================
-- Ejecuta este código completo en el SQL Editor de Supabase.
-- Usa comandos directos sin bucles para asegurar la compatibilidad.
-- ==========================================

DROP POLICY IF EXISTS "Permitir lectura publica" ON "Alerta";
CREATE POLICY "Permitir lectura publica" ON "Alerta" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "FichaAlerta";
CREATE POLICY "Permitir lectura publica" ON "FichaAlerta" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "ActualizacionAlerta";
CREATE POLICY "Permitir lectura publica" ON "ActualizacionAlerta" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "Actividad";
CREATE POLICY "Permitir lectura publica" ON "Actividad" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "Comentario";
CREATE POLICY "Permitir lectura publica" ON "Comentario" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "Localidad";
CREATE POLICY "Permitir lectura publica" ON "Localidad" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "Usuario";
CREATE POLICY "Permitir lectura publica" ON "Usuario" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "FichaResultados";
CREATE POLICY "Permitir lectura publica" ON "FichaResultados" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "Evidencia";
CREATE POLICY "Permitir lectura publica" ON "Evidencia" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "AsignacionLocalidad";
CREATE POLICY "Permitir lectura publica" ON "AsignacionLocalidad" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "Plan";
CREATE POLICY "Permitir lectura publica" ON "Plan" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "ObjetivoEstrategico";
CREATE POLICY "Permitir lectura publica" ON "ObjetivoEstrategico" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "Programa";
CREATE POLICY "Permitir lectura publica" ON "Programa" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "Hito";
CREATE POLICY "Permitir lectura publica" ON "Hito" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "SubTarea";
CREATE POLICY "Permitir lectura publica" ON "SubTarea" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "CorteMensual";
CREATE POLICY "Permitir lectura publica" ON "CorteMensual" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "ReporteCualitativo";
CREATE POLICY "Permitir lectura publica" ON "ReporteCualitativo" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "Reunion";
CREATE POLICY "Permitir lectura publica" ON "Reunion" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "AsistenteReunion";
CREATE POLICY "Permitir lectura publica" ON "AsistenteReunion" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "CompromisoReunion";
CREATE POLICY "Permitir lectura publica" ON "CompromisoReunion" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "Informe";
CREATE POLICY "Permitir lectura publica" ON "Informe" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "Evento";
CREATE POLICY "Permitir lectura publica" ON "Evento" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "SeguimientoNormativo";
CREATE POLICY "Permitir lectura publica" ON "SeguimientoNormativo" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "OtroEspacioArticulacion";
CREATE POLICY "Permitir lectura publica" ON "OtroEspacioArticulacion" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "FrenteObra";
CREATE POLICY "Permitir lectura publica" ON "FrenteObra" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica" ON "AlertaObra";
CREATE POLICY "Permitir lectura publica" ON "AlertaObra" FOR SELECT USING (true);
