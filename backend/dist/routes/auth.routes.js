"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Este endpoint es llamado por el frontend inmediatamente después del login con MSAL
// para obtener el rol, la localidad asignada y permisos del usuario desde nuestra BD Postgres.
router.get('/me', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const user = req.user;
        // Obtener localidades donde es responsable principal
        const localidadesPrincipal = await prisma.localidad.findMany({
            where: { responsablePrincipalId: user.id },
            select: { id: true }
        });
        // Obtener localidades donde tiene asignaciones directas
        const asignaciones = await prisma.asignacionLocalidad.findMany({
            where: { responsableId: user.id },
            select: { localidadId: true },
            distinct: ['localidadId']
        });
        const localidadesSet = new Set([
            ...localidadesPrincipal.map(l => l.id),
            ...asignaciones.map(a => a.localidadId)
        ]);
        res.json({
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol,
            localidadesAsignadas: Array.from(localidadesSet)
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error obteniendo perfil del usuario.' });
    }
});
exports.default = router;
