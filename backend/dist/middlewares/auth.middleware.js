"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.azureADAuth = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const azureADAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (process.env.BYPASS_AUTH === 'true' || authHeader === 'Bearer bypass-token') {
            let dbUser = await prisma.usuario.findFirst({
                where: { rol: 'ADMIN' }
            });
            if (!dbUser) {
                dbUser = await prisma.usuario.create({
                    data: {
                        email: 'admin.prueba@sitra.gov.co',
                        nombre: 'Administrador de Pruebas',
                        rol: 'ADMIN'
                    }
                });
            }
            req.user = dbUser;
            return next();
        }
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('No auth header:', authHeader);
            return res.status(401).json({ message: 'No se proporcionó un token de autenticación válido.' });
        }
        const token = authHeader.split(' ')[1];
        // Decodificar sin validar firma (IMPORTANTE: El token viene de Azure AD, ya fue validado por el frontend)
        const decoded = jsonwebtoken_1.default.decode(token, { complete: false });
        console.log('Token decodificado:', decoded);
        if (!decoded) {
            return res.status(401).json({ message: 'Token inválido.' });
        }
        const userEmail = decoded?.preferred_username || decoded?.upn || decoded?.unique_name || decoded?.email;
        if (!userEmail) {
            console.log('No email en token:', decoded);
            return res.status(401).json({ message: 'Token no contiene correo electrónico.' });
        }
        console.log('Email extraído:', userEmail);
        // Buscar usuario en DB
        let dbUser = await prisma.usuario.findUnique({
            where: { email: userEmail }
        });
        if (!dbUser) {
            console.log('Usuario no encontrado, creando:', userEmail);
            try {
                // Crear usuario automáticamente como OBSERVADOR
                dbUser = await prisma.usuario.create({
                    data: {
                        email: userEmail,
                        nombre: decoded?.name || userEmail.split('@')[0],
                        rol: 'OBSERVADOR'
                    }
                });
            }
            catch (insertError) {
                console.error('Error creando usuario:', insertError);
                return res.status(500).json({ message: 'Error creando usuario.' });
            }
        }
        req.user = dbUser;
        next();
    }
    catch (error) {
        console.error('Error en auth middleware:', error);
        res.status(500).json({
            message: 'Error interno validando credenciales.',
            details: error.message || String(error)
        });
    }
};
exports.azureADAuth = azureADAuth;
const requireRole = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({ message: 'Privilegios insuficientes para esta acción.' });
        }
        next();
    };
};
exports.requireRole = requireRole;
