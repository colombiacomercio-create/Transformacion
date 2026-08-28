const fs = require('fs');
let schema = fs.readFileSync('D:/Transformacion/backend/prisma/schema.prisma', 'utf8');

const newFields = `
    // --- Nuevos Campos para Rediseño Fichas (2026) ---
    avancesEjecucion          String?  @db.Text
    avancesObras              String?  @db.Text
    avancesRollos             String?  @db.Text
    avancesResiduos           String?  @db.Text
    avancesVenta              String?  @db.Text
    avancesActuaciones        String?  @db.Text
    avancesConvivencia        String?  @db.Text
    avancesEstrategias        String?  @db.Text
    
    obrasProgramadasAlCorte   Int?
    
    totalRollos               Int?
    rollosAvancesSignificativos Int?
    rollosProgramadosAlCorte  Int?
    
    puntosCriticosPriorizados Int?
    puntosSostenidos          Int?
    puntosSostenidosProgramados Int?
    personasSensibilizadas    Int?
    personasSensibilizadasProgramadas Int?
    operativosIVC             Int?
    operativosIVCProgramados  Int?
    
    puntosVerificados         Int?
    puntosProgramadosSostenibilidad Int?
    puntosSostenibilidadEfectiva Int?
    
    archivosProgramadosCorte  Float?
    fallosProgramadosCorte    Float?
    
    motosMetaTotal            Int?
    motosProgramadasCorte     Int?
    
    estrategiasTotal          Int?
    estrategiasAjustes        Int?
    estrategiasValidacionTecnica Int?
    estrategiasProgramadasCorte Int?
    // -------------------------------------------------
`;

schema = schema.replace('ejecucionActPorId         String?', newFields + '\n    ejecucionActPorId         String?');
fs.writeFileSync('D:/Transformacion/backend/prisma/schema.prisma', schema);
