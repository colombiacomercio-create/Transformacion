"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Este endpoint es llamado por el frontend inmediatamente después del login con MSAL
// para obtener el rol, la localidad asignada y permisos del usuario desde nuestra BD Postgres.
router.get('/me', auth_middleware_1.azureADAuth, async (req, res) => {
    try {
        const user = req.user;
        res.json({
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error obteniendo perfil del usuario.' });
    }
});
exports.default = router;
