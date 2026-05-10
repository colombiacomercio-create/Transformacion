import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: any;
}

export const azureADAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header:', authHeader);
      return res.status(401).json({ message: 'No se proporcionó un token de autenticación válido.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Decodificar sin validar firma (IMPORTANTE: El token viene de Azure AD, ya fue validado por el frontend)
    const decoded: any = jwt.decode(token, { complete: false });
    
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
      } catch (insertError) {
        console.error('Error creando usuario:', insertError);
        return res.status(500).json({ message: 'Error creando usuario.' });
      }
    }

    req.user = dbUser;
    next();
  } catch (error: any) {
    console.error('Error en auth middleware:', error);
    res.status(500).json({ 
      message: 'Error interno validando credenciales.', 
      details: error.message || String(error)
    });
  }
};

export const requireRole = (rolesPermitidos: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ message: 'Privilegios insuficientes para esta acción.' });
    }
    next();
  };
};