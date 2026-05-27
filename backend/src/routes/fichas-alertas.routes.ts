import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Obtener todas las fichas (filtradas por localidad si el usuario es gestor, u ocultadas si no hay bypass?)
router.get('/', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    let filtro = {};
    if (user.rol === 'GESTOR') {
       const asignaciones = await prisma.asignacionLocalidad.findMany({ where: { responsableId: user.id }});
       const checkUserGestor = (asignaciones.length === 0 && user.id === 'gestor-local-123') ? await prisma.localidad.findFirst() : null;
       const localIds = checkUserGestor ? [checkUserGestor.id] : asignaciones.map(a => a.localidadId);
       filtro = { OR: [{ localidadId: { in: localIds } }, { localidadId: null }] };
    }
    
    const fichas = await prisma.fichaAlerta.findMany({
      where: filtro,
      include: {
         objetivo: true,
         actividad: true,
         localidad: true,
         creador: true
      },
      orderBy: { fechaCreacion: 'desc' }
    });
    res.json(fichas);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo fichas de alerta' });
  }
});

// Crear una ficha
router.post('/', azureADAuth, async (req: AuthRequest, res) => {
  const { objetivoId, actividadId, localidadId, tipo, descripcion, responsable, fechaCompromiso } = req.body;
  
  try {
    const ficha = await prisma.fichaAlerta.create({
       data: {
          objetivoId: objetivoId || null,
          actividadId: actividadId || null,
          localidadId,
          tipo,
          descripcion,
          responsable,
          fechaCompromiso: fechaCompromiso ? new Date(fechaCompromiso) : null,
          creadoPorId: req.user!.id,
          ultimaAccion: "[]" // Inicializar historial vacío
       }
    });
    res.json(ficha);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando ficha de alerta' });
  }
});

// Cerrar / Editar ficha (Registrar Gestión)
router.patch('/:id/estado', azureADAuth, async (req: AuthRequest, res) => {
  const { estado, ultimaAccion, expectativa, responsable } = req.body;
  try {
     const fichaAnterior = await prisma.fichaAlerta.findUnique({ where: { id: req.params.id } });
     if (!fichaAnterior) return res.status(404).json({ error: 'No encontrada' });

     let historial = [];
     try {
       historial = JSON.parse(fichaAnterior.ultimaAccion || '[]');
       if (!Array.isArray(historial)) historial = [];
     } catch (e) {
       if (fichaAnterior.ultimaAccion) {
         historial = [{
           fecha: fichaAnterior.fechaCreacion.toISOString(),
           usuario: 'Historial Legado',
           estadoAnterior: 'ABIERTA',
           estadoNuevo: fichaAnterior.estado,
           accion: fichaAnterior.ultimaAccion
         }];
       }
     }

     const dataToUpdate: any = {};
     if (estado) dataToUpdate.estado = estado;
     if (responsable) dataToUpdate.responsable = responsable;

     if (ultimaAccion) {
        historial.push({
           fecha: new Date().toISOString(),
           usuario: req.user!.nombre,
           estadoAnterior: fichaAnterior.estado,
           estadoNuevo: estado || fichaAnterior.estado,
           accion: ultimaAccion,
           expectativa: expectativa || null
        });
        dataToUpdate.ultimaAccion = JSON.stringify(historial);
     }

     const ficha = await prisma.fichaAlerta.update({
        where: { id: req.params.id },
        data: dataToUpdate
     });
     res.json(ficha);
  } catch(error) {
     res.status(500).json({ error: 'Error actualizando estado' });
  }
});

export default router;
