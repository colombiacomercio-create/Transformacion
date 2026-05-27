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
    
    const localidadesSet = new Set<string>([
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
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo perfil del usuario.' });
  }
});

export default router;
