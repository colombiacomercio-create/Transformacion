const fs = require('fs');
const schemaPath = 'D:/Transformacion/backend/prisma/schema.prisma';

const models = `

// ─── TABLERO OBRAS LOCALES ───────────────────────────────────────────────────

model FrenteObra {
  id                        Int       @id @default(autoincrement())
  localidad                 String?
  contrato                  String?
  tipo_intervencion         String?
  estado                    String?
  porcentaje_avance         Float?
  crono_inicio              DateTime?
  crono_fin                 DateTime?
  fecha_real_fin            DateTime?
  valor_final               Float?
  km_carril                 Float?
  m2                        Float?
  ml                        Float?
  huecos                    Float?
  tipo_contrato             String?
  categoria_inversion       String?
  justificacion_suspension  String?   @db.Text
  fecha_suspension          DateTime?
  fecha_corte               String?
}

model AlertaObra {
  id                        Int       @id @default(autoincrement())
  localidad                 String?
  contrato                  String?
  estado_general            String?   @db.Text
  acogio_tecnica            String?   @db.Text
  acogio_juridica           String?   @db.Text
  gestiones_otras_entidades String?   @db.Text
  observacion_tecnica       String?   @db.Text
  observacion_juridica      String?   @db.Text
  fecha_corte               String?
}

model MetadatoObra {
  id          Int      @id @default(autoincrement())
  fecha_corte String?
}
`;

fs.appendFileSync(schemaPath, models);
console.log("Appended Obras models to schema.prisma");
