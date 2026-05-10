"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const mockActividades = [
    {
        id: '1',
        codigoCompleto: 'P01.H1.A1',
        nombre: 'Reporte Consolidado',
        fechaLimite: '2026-02-28',
        estado: 'PENDIENTE',
        progreso: 0
    }
];
router.get('/', (req, res) => {
    res.json(mockActividades);
});
exports.default = router;
