import { Router } from 'express';
import { azureADAuth, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Este endpoint es llamado por el frontend inmediatamente después del login con MSAL
// para obtener el rol, la localidad asignada y permisos del usuario desde nuestra BD Postgres.
router.get('/me', azureADAuth, async (req: AuthRequest, res) => {
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
    
    // Obtener localidades de actividades donde el usuario está en correosNotificacion
    const userEmailLower = (user.email || '').toLowerCase();
    const actividadesConCorreo = await prisma.actividad.findMany({
      where: {
        correosNotificacion: { has: userEmailLower }
      },
      select: {
        asignaciones: {
          select: { localidadId: true }
        }
      }
    });

    const localidadesDeActividades = actividadesConCorreo.flatMap(a => a.asignaciones.map(asig => asig.localidadId));

    const localidadesSet = new Set<string>([
      ...localidadesPrincipal.map(l => l.id),
      ...asignaciones.map(a => a.localidadId),
      ...localidadesDeActividades
    ]);

    res.json({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      localidadesAsignadas: Array.from(localidadesSet)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo perfil del usuario.' });
  }
});

// Obtener lista de usuarios para asignación de responsables
router.get('/usuarios', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true, email: true, rol: true },
      orderBy: { nombre: 'asc' }
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error obteniendo usuarios.' });
  }
});

export default router;
