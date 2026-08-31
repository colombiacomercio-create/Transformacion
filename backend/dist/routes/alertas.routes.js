"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const mail_service_1 = require("../services/mail.service");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Obtener todas las alertas
router.get('/', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const user = req.user;
        let validFilter = {};
        if (user.rol === 'GESTOR') {
            const localidadesGestor = await prisma.localidad.findMany({
                where: { responsablePrincipalId: user.id }
            });
            validFilter = { localidadId: { in: localidadesGestor.map((l) => l.id) } };
        }
        const alertas = await prisma.alerta.findMany({
            where: validFilter,
            include: { actividad: true, localidad: true }
        });
        res.json(alertas);
    }
    catch (error) {
        res.status(500).json({ error: 'Error obteniendo alertas' });
    }
});
// Endpoint/Cron manual para correr las validaciones de negocio
router.post('/ejecutar-reglas', auth_middleware_1.azureADAuth, (0, auth_middleware_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const actividades = await prisma.actividad.findMany({
            where: { estado: { not: 'COMPLETADA' } },
            include: { evidencias: true, asignaciones: { include: { responsable: true } } }
        });
        const nuevasAlertas = [];
        const ahora = new Date();
        for (const act of actividades) {
            // Si no tiene fecha límite, se salta el cálculo de vencimiento
            if (!act.fechaLimite)
                continue;
            // Regla 1: Alerta Vencimiento (vence en próximos 7 días sin evidencia)
            const diasParaVencer = Math.ceil((act.fechaLimite.getTime() - ahora.getTime()) / (1000 * 3600 * 24));
            if (diasParaVencer > 0 && diasParaVencer <= 7 && act.evidencias.length === 0) {
                nuevasAlertas.push({
                    tipo: 'VENCIMIENTO',
                    act: act,
                    nivel: 'MODERADA'
                });
            }
            // Regla 2: Crítica (Vencida)
            if (diasParaVencer < 0) {
                nuevasAlertas.push({
                    tipo: 'VENCIMIENTO',
                    act: act,
                    nivel: 'CRITICA'
                });
                await prisma.actividad.update({ where: { id: act.id }, data: { estado: 'VENCIDA' } });
            }
        }
        // Persistir nuevas y notificar
        for (const param of nuevasAlertas) {
            for (const asig of param.act.asignaciones) {
                await prisma.alerta.create({
                    data: {
                        actividadId: param.act.id,
                        localidadId: asig.localidadId,
                        tipo: param.tipo,
                        nivel: param.nivel,
                        descripcion: `La actividad ${param.act.codigoCompleto} generó una alerta de ${param.tipo}.`
                    }
                });
                // Enviar Correo SMTP solo si hay un responsable con email válido
                if (asig.responsable && asig.responsable.email) {
                    await (0, mail_service_1.enviarNotificacion)([asig.responsable.email], `Alerta Sistema Transformación: ${param.tipo}`, `<h3>Atención</h3><p>La actividad <b>${param.act.nombre}</b> requiere su acción urgente.</p>`);
                }
            }
        }
        res.json({ mensaje: `Proceso finalizado. ${nuevasAlertas.length} alertas evaluadas.` });
    }
    catch (error) {
        res.status(500).json({ error: 'Error procesando motor de reglas.' });
    }
});
exports.default = router;
