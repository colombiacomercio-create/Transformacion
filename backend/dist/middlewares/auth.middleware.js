"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.azureADAuth = void 0;
const db_1 = require("../db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const azureADAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
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
        // Buscar usuario en Supabase
        const { data: dbUser, error } = await db_1.supabase
            .from('Usuario')
            .select('*')
            .eq('email', userEmail)
            .single();
        if (error || !dbUser) {
            console.log('Usuario no encontrado, creando:', userEmail);
            // Crear usuario automáticamente como OBSERVADOR
            const { data: newUser, error: insertError } = await db_1.supabase
                .from('Usuario')
                .insert([
                {
                    email: userEmail,
                    nombre: decoded?.name || userEmail.split('@')[0],
                    rol: 'OBSERVADOR'
                }
            ])
                .select()
                .single();
            if (insertError) {
                console.error('Error creando usuario:', insertError);
                return res.status(500).json({ message: 'Error creando usuario.' });
            }
            req.user = newUser;
            return next();
        }
        req.user = dbUser;
        next();
    }
    catch (error) {
        console.error('Error en auth middleware:', error);
        res.status(500).json({ message: 'Error interno validando credenciales.' });
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
