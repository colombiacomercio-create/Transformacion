
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const existing = await prisma.fichaResultados.findFirst({ where: { periodo: new Date('2026-09-18') }});
    const data = {
        id: existing.id,
        periodo: '2026-09-18',
        seccionesActualizadas: ['ejecucion', 'obras', 'rollos', 'espacioResid', 'ventaInformal', 'actuaciones', 'convivencia', 'memoria'],
        compromisosPct: 20.5,
        vehiculosMetaTotal: 200,
    };
    
    const periodoDate = new Date(data.periodo);
    const userId = '3513ffc8-1455-406f-afe0-d8f91084e2ed';
    const ahora = new Date();
    const secciones = data.seccionesActualizadas || [];

    const fields = {
      periodo: periodoDate,
      compromisosPct: data.compromisosPct ?? null,
      metaCompromisosPct: data.metaCompromisosPct ?? null,
      girosPct: data.girosPct ?? null,
      metaGirosPct: data.metaGirosPct ?? null,
      procesosMonitoreados: data.procesosMonitoreados ?? null,
      procesosRequierenComite: data.procesosRequierenComite ?? null,
      alertaEjecucion: data.alertaEjecucion ?? null,

      avancesEjecucion: data.avancesEjecucion ?? null,
      avancesObras: data.avancesObras ?? null,
      avancesRollos: data.avancesRollos ?? null,
      avancesResiduos: data.avancesResiduos ?? null,
      avancesVenta: data.avancesVenta ?? null,
      avancesActuaciones: data.avancesActuaciones ?? null,
      avancesConvivencia: data.avancesConvivencia ?? null,
      avancesEstrategias: data.avancesEstrategias ?? null,
      
      obrasProgramadasAlCorte: data.obrasProgramadasAlCorte ?? null,
      obrasMallaVial: data.obrasMallaVial ?? null,
      obrasEspacioPublico: data.obrasEspacioPublico ?? null,
      obrasViviendaRural: data.obrasViviendaRural ?? null,
      obrasParque: data.obrasParque ?? null,
      obrasSalonComunal: data.obrasSalonComunal ?? null,
      obrasOtras: data.obrasOtras ?? null,

      totalRollos: data.totalRollos ?? null,
      rollosAvancesSignificativos: data.rollosAvancesSignificativos ?? null,
      rollosProgramadosAlCorte: data.rollosProgramadosAlCorte ?? null,
      rollosDesenrolladosLista: data.rollosDesenrolladosLista ?? null,
      rollosDesenrollandoseLista: data.rollosDesenrollandoseLista ?? null,
      rollosSinDesenrollarseLista: data.rollosSinDesenrollarseLista ?? null,
      rollosSinDesenrollarse: data.rollosSinDesenrollarse ?? null,

      puntosCriticosPriorizados: data.puntosCriticosPriorizados ?? null,
      puntosSostenidos: data.puntosSostenidos ?? null,
      puntosSostenidosProgramados: data.puntosSostenidosProgramados ?? null,
      residuosProgramadoAlCorte: data.residuosProgramadoAlCorte ?? null,
      residuosIntervencionesSemestre: data.residuosIntervencionesSemestre ?? null,

      personasSensibilizadas: data.personasSensibilizadas ?? null,
      personasSensibilizadasProgramadas: data.personasSensibilizadasProgramadas ?? null,
      operativosIVC: data.operativosIVC ?? null,
      operativosIVCProgramados: data.operativosIVCProgramados ?? null,

      puntosVerificados: data.puntosVerificados ?? null,
      puntosProgramadosSostenibilidad: data.puntosProgramadosSostenibilidad ?? null,
      puntosSostenibilidadEfectiva: data.puntosSostenibilidadEfectiva ?? null,
      espacioPuntosSostenidos: data.espacioPuntosSostenidos ?? null,
      espacioProgramadoAlCorte: data.espacioProgramadoAlCorte ?? null,
      espacioIntervencionesSemestre: data.espacioIntervencionesSemestre ?? null,

      archivosProgramadosCorte: data.archivosProgramadosCorte ?? null,
      fallosProgramadosCorte: data.fallosProgramadosCorte ?? null,
      archivosReal: data.archivosReal ?? null,
      fallosReal: data.fallosReal ?? null,

      vehiculosMetaTotal: data.vehiculosMetaTotal ?? null,
      vehiculosProgramadosCorte: data.vehiculosProgramadosCorte ?? null,
      vehiculosEntregadosPolicia: data.vehiculosEntregadosPolicia ?? null,
      vehiculosEntregadosSdscj: data.vehiculosEntregadosSdscj ?? null,
      vehiculosEntregadosAlmacen: data.vehiculosEntregadosAlmacen ?? null,
      vehiculosPendienteEntrega: data.vehiculosPendienteEntrega ?? null,

      estrategiasTotal: data.estrategiasTotal ?? null,
      estrategiasAjustes: data.estrategiasAjustes ?? null,
      estrategiasValidacionTecnica: data.estrategiasValidacionTecnica ?? null,
      estrategiasProgramadasCorte: data.estrategiasProgramadasCorte ?? null,

      reportadoPorId: userId,
      
      ejecucionActPorId: data.ejecucionActPorId ?? null,
      ejecucionActEn: data.ejecucionActEn ? new Date(data.ejecucionActEn) : null,
      obrasActPorId: data.obrasActPorId ?? null,
      obrasActEn: data.obrasActEn ? new Date(data.obrasActEn) : null,
      comitesActPorId: data.comitesActPorId ?? null,
      comitesActEn: data.comitesActEn ? new Date(data.comitesActEn) : null,
      espacioResiduosActPorId: data.espacioResiduosActPorId ?? null,
      espacioResiduosActEn: data.espacioResiduosActEn ? new Date(data.espacioResiduosActEn) : null,
      espacioVentaActPorId: data.espacioVentaActPorId ?? null,
      espacioVentaActEn: data.espacioVentaActEn ? new Date(data.espacioVentaActEn) : null,
      convivenciaActPorId: data.convivenciaActPorId ?? null,
      convivenciaActEn: data.convivenciaActEn ? new Date(data.convivenciaActEn) : null,
      actuacionesActPorId: data.actuacionesActPorId ?? null,
      actuacionesActEn: data.actuacionesActEn ? new Date(data.actuacionesActEn) : null,
      estrategiasActPorId: data.estrategiasActPorId ?? null,
      estrategiasActEn: data.estrategiasActEn ? new Date(data.estrategiasActEn) : null,
      rollosActPorId: data.rollosActPorId ?? null,
      rollosActEn: data.rollosActEn ? new Date(data.rollosActEn) : null,

      ...(() => {
        const getDate = (val) => val ? new Date(val) : ahora;
        return {
          ...(secciones.includes('ejecucion') && { ejecucionActPorId: userId, ejecucionActEn: getDate(data.ejecucionActEn) }),
          ...(secciones.includes('obras') && { obrasActPorId: userId, obrasActEn: getDate(data.obrasActEn) }),
          ...(secciones.includes('comites') && { comitesActPorId: userId, comitesActEn: getDate(data.comitesActEn) }),
          ...(secciones.includes('espacioResid') && { espacioResiduosActPorId: userId, espacioResiduosActEn: getDate(data.espacioResiduosActEn) }),
          ...(secciones.includes('ventaInformal') && { espacioVentaActPorId: userId, espacioVentaActEn: getDate(data.espacioVentaActEn) }),
          ...(secciones.includes('convivencia') && { convivenciaActPorId: userId, convivenciaActEn: getDate(data.convivenciaActEn) }),
          ...(secciones.includes('actuaciones') && { actuacionesActPorId: userId, actuacionesActEn: getDate(data.actuacionesActEn) }),
          ...(secciones.includes('memoria') && { estrategiasActPorId: userId, estrategiasActEn: getDate(data.estrategiasActEn) }),
          ...(secciones.includes('rollos') && { rollosActPorId: userId, rollosActEn: getDate(data.rollosActEn) }),
        };
      })(),
    };

    const result = await prisma.fichaResultados.update({
         where: { id: data.id },
         data: fields
       });
    console.log('UPDATE SUCCESS');
  } catch(e) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();

