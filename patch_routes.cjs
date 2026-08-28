const fs = require('fs');
let file = fs.readFileSync('D:/Transformacion/backend/src/routes/ficha-resultados.routes.ts', 'utf8');

const newFieldsCode = `
      avancesEjecucion: data.avancesEjecucion ?? null,
      avancesObras: data.avancesObras ?? null,
      avancesRollos: data.avancesRollos ?? null,
      avancesResiduos: data.avancesResiduos ?? null,
      avancesVenta: data.avancesVenta ?? null,
      avancesActuaciones: data.avancesActuaciones ?? null,
      avancesConvivencia: data.avancesConvivencia ?? null,
      avancesEstrategias: data.avancesEstrategias ?? null,

      obrasProgramadasAlCorte: data.obrasProgramadasAlCorte ?? null,

      totalRollos: data.totalRollos ?? null,
      rollosAvancesSignificativos: data.rollosAvancesSignificativos ?? null,
      rollosProgramadosAlCorte: data.rollosProgramadosAlCorte ?? null,

      puntosCriticosPriorizados: data.puntosCriticosPriorizados ?? null,
      puntosSostenidos: data.puntosSostenidos ?? null,
      puntosSostenidosProgramados: data.puntosSostenidosProgramados ?? null,
      personasSensibilizadas: data.personasSensibilizadas ?? null,
      personasSensibilizadasProgramadas: data.personasSensibilizadasProgramadas ?? null,
      operativosIVC: data.operativosIVC ?? null,
      operativosIVCProgramados: data.operativosIVCProgramados ?? null,

      puntosVerificados: data.puntosVerificados ?? null,
      puntosProgramadosSostenibilidad: data.puntosProgramadosSostenibilidad ?? null,
      puntosSostenibilidadEfectiva: data.puntosSostenibilidadEfectiva ?? null,

      archivosProgramadosCorte: data.archivosProgramadosCorte ?? null,
      fallosProgramadosCorte: data.fallosProgramadosCorte ?? null,

      motosMetaTotal: data.motosMetaTotal ?? null,
      motosProgramadasCorte: data.motosProgramadasCorte ?? null,

      estrategiasTotal: data.estrategiasTotal ?? null,
      estrategiasAjustes: data.estrategiasAjustes ?? null,
      estrategiasValidacionTecnica: data.estrategiasValidacionTecnica ?? null,
      estrategiasProgramadasCorte: data.estrategiasProgramadasCorte ?? null,
`;

file = file.replace('      observaciones: data.observaciones ?? null,', '      observaciones: data.observaciones ?? null,\n' + newFieldsCode);
fs.writeFileSync('D:/Transformacion/backend/src/routes/ficha-resultados.routes.ts', file);
