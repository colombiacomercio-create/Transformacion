"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Iniciando script de semillas (Seed)...');
    // 1. Limpiar base de datos (opcional para evitar duplicados en pruebas)
    await prisma.comentario.deleteMany();
    await prisma.evidencia.deleteMany();
    await prisma.alerta.deleteMany();
    await prisma.subTarea.deleteMany();
    await prisma.asignacionLocalidad.deleteMany();
    await prisma.actividad.deleteMany();
    await prisma.hito.deleteMany();
    await prisma.programa.deleteMany();
    await prisma.objetivoEstrategico.deleteMany();
    await prisma.plan.deleteMany();
    await prisma.localidad.deleteMany();
    await prisma.usuario.deleteMany();
    // 2. Crear Usuarios Básicos (Admin Central y Gestores)
    const adminCentral = await prisma.usuario.create({
        data: {
            email: 'admin.transformacion@bogota.gov.co',
            nombre: 'Administrador Central',
            rol: 'ADMIN',
        },
    });
    const gestorSuba = await prisma.usuario.create({
        data: {
            email: 'gestor.suba@bogota.gov.co',
            nombre: 'Referente Suba',
            rol: 'GESTOR',
        },
    });
    console.log('Usuarios creados:', [adminCentral.email, gestorSuba.email]);
    // 3. Crear Localidades (20 Localidades de Bogotá)
    const localidadesNombres = [
        'Usaquén', 'Chapinero', 'Santa Fe', 'San Cristóbal', 'Usme',
        'Tunjuelito', 'Bosa', 'Kennedy', 'Fontibón', 'Engativá',
        'Suba', 'Barrios Unidos', 'Teusaquillo', 'Los Mártires', 'Antonio Nariño',
        'Puente Aranda', 'La Candelaria', 'Rafael Uribe Uribe', 'Ciudad Bolívar', 'Sumapaz'
    ];
    const localidades = await Promise.all(localidadesNombres.map((nombre, i) => prisma.localidad.create({
        data: {
            nombre,
            codigoDANE: `11001${String(i + 1).padStart(2, '0')}`,
            // Asigna Suba a nuestro gestor ficticio
            responsablePrincipalId: nombre === 'Suba' ? gestorSuba.id : null,
            colorHex: `#${Math.floor(Math.random() * 16777215).toString(16)}`
        }
    })));
    console.log('20 Localidades creadas.');
    // 4. Crear Plan Estratégico
    const plan2026 = await prisma.plan.create({
        data: {
            nombre: 'Plan de Transformación Institucional 2026',
            ano: 2026,
            descripcion: 'Ejecución prioritaria para la Administración Distrital en las Alcaldías Locales.',
            estado: 'ACTIVO',
            creadoPor: adminCentral.id
        }
    });
    // 5. Crear Objetivos
    const obj1 = await prisma.objetivoEstrategico.create({
        data: {
            planId: plan2026.id,
            codigo: 'O1',
            nombre: 'Ejecución Presupuestal',
            orden: 1
        }
    });
    // 6. Crear Programa
    const prog1 = await prisma.programa.create({
        data: {
            objetivoId: obj1.id,
            codigo: 'P01',
            nombre: 'Optimización de Recursos',
        }
    });
    // 7. Crear Hito
    const hito1 = await prisma.hito.create({
        data: {
            programaId: prog1.id,
            codigo: 'H1',
            nombre: 'Cierre Financiero Q1',
            fechaLimite: new Date('2026-03-31T00:00:00Z'),
        }
    });
    // 8. Crear Actividad
    const actividad1 = await prisma.actividad.create({
        data: {
            hitoId: hito1.id,
            codigoCompleto: 'P01.H1.A1',
            nombre: 'Reporte Consolidado de Inversiones',
            descripcion: 'Entregar soporte de contratación de las primeras dos semanas de ejecución.',
            fechaInicio: new Date('2026-01-01T00:00:00Z'),
            fechaLimite: new Date('2026-02-28T00:00:00Z'),
            prioridad: 'ALTA',
            tiposEvidenciaRequeridos: ['documento', 'reporte'],
            indicadorMeta: 100,
            indicadorUnidad: '%',
            creadoPor: adminCentral.id
        }
    });
    // Asignar actividad a todas las localidades
    for (let loc of localidades) {
        let responsableId = loc.responsablePrincipalId || adminCentral.id;
        await prisma.asignacionLocalidad.create({
            data: {
                actividadId: actividad1.id,
                localidadId: loc.id,
                responsableId: responsableId,
            }
        });
        // Crear subtareas base de esa actividad
        await prisma.subTarea.createMany({
            data: [
                { actividadId: actividad1.id, descripcion: 'Revisar matriz de compras', ordenVisualizacion: 1 },
                { actividadId: actividad1.id, descripcion: 'Adjuntar contrato firmado', ordenVisualizacion: 2 }
            ]
        });
    }
    console.log('Estructura de Plan jerárquico y Asignaciones creada con éxito.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
