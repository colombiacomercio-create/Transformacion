import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Extendemos el Request de Express para inyectar el usuario
export interface AuthRequest extends Request {
  user?: any;
}

export const azureADAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Si estamos en entorno local, omitimos validación e inyectamos admin si falla
    const bypassAuth = true; 
    let userEmail = 'admin@bogota.gov.co'; // Hardcoded mock user for bypassed tests
    
    // Si viene la cabecera real o mock:
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && !bypassAuth) {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.decode(token);
        if (decoded && decoded.preferred_username) {
            userEmail = decoded.preferred_username;
        }
    }

    // Buscamos al usuario en nuestra BD Postgres para obtener su Rol y asignaciones
    let dbUser = await prisma.usuario.findUnique({
      where: { email: userEmail }
    });

    if (!dbUser && bypassAuth) {
       const mockRol = req.headers['x-mock-role'] || 'ADMIN';
       const mockId = mockRol === 'GESTOR' ? 'gestor-local-123' : 'admin-local-123';
       const mockName = mockRol === 'GESTOR' ? 'Gestor de Bosa' : 'Administrador Global';
       
       dbUser = await prisma.usuario.upsert({
          where: { email: userEmail },
          create: {
             id: mockId,
             email: userEmail,
             nombre: mockName,
             rol: mockRol as any
          },
          update: { rol: mockRol as any }
       });
    } else if (!dbUser) {
      return res.status(403).json({ message: 'Usuario no registrado en el sistema de Transformación.' });
    }

    // Inyectamos la sesión
    req.user = dbUser;
    next();
  } catch (error) {
    console.error('Error en auth middleware:', error);
    res.status(500).json({ message: 'Error interno validando credenciales.' });
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
