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
    } else if (user.rol === 'OBSERVADOR') {
       filtro = { correosResponsables: { has: user.email } };
    }
    
    const fichas = await prisma.fichaAlerta.findMany({
      where: filtro,
      include: {
         objetivo: true,
         actividad: true,
         localidad: true,
         creador: true,
         actualizaciones: { orderBy: { fechaCreacion: 'desc' } }
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
  const { objetivoId, actividadId, localidadId, tipo, descripcion, responsable, fechaCompromiso, correosResponsables } = req.body;
  
  try {
    const ficha = await prisma.fichaAlerta.create({
       data: {
          objetivoId: objetivoId || null,
          actividadId: actividadId || null,
          localidadId,
          tipo,
          descripcion,
          responsable,
          correosResponsables: correosResponsables || [],
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

     let historial: any[] = [];
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

     // Allow OBSERVADOR to only add an action/status update if they are in correosResponsables? No, they use the new endpoint.
     if (req.user!.rol === 'OBSERVADOR') return res.status(403).json({ error: 'No autorizado para cambiar estado' });

     const ficha = await prisma.fichaAlerta.update({
        where: { id: req.params.id },
        data: dataToUpdate
     });
     res.json(ficha);
  } catch(error) {
     res.status(500).json({ error: 'Error actualizando estado' });
  }
});

// POST /api/fichas-alertas/:id/actualizaciones — agregar actualización externa
router.post('/:id/actualizaciones', azureADAuth, async (req: AuthRequest, res) => {
  const { comentario, urlArchivo } = req.body;
  try {
     const alerta = await prisma.fichaAlerta.findUnique({ where: { id: req.params.id } });
     if (!alerta) return res.status(404).json({ error: 'No encontrada' });

     // Si es observador, validar que esté en correosResponsables
     if (req.user!.rol === 'OBSERVADOR' && !alerta.correosResponsables.includes(req.user!.email)) {
        return res.status(403).json({ error: 'No autorizado para actualizar esta alerta' });
     }

     const actualizacion = await prisma.actualizacionAlerta.create({
        data: {
           fichaAlertaId: alerta.id,
           autorEmail: req.user!.email,
           autorNombre: req.user!.nombre,
           comentario,
           urlArchivo: urlArchivo || null
        }
     });
     res.json(actualizacion);
  } catch (error) {
     res.status(500).json({ error: 'Error agregando actualización' });
  }
});

export default router;
