import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, AuthRequest, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.get('/', azureADAuth, async (req: Request, res: Response) => {
  try {
    const actividades = await prisma.actividad.findMany({
      include: {
        hito: {
          include: {
            programa: {
              include: {
                objetivo: true
              }
            }
          }
        },
        asignaciones: {
          include: {
            localidad: true,
            responsable: true
          }
        },
        evidencias: true,
        comentarios: {
          include: { autor: true },
          orderBy: { fechaCreacion: 'asc' }
        }
      }
    });
    res.json(actividades);
  } catch (error) {
    console.error('Error fetching actividades:', error);
    res.status(500).json({ error: 'Error fetching actividades' });
  }
});

// Crear Actividad
router.post('/', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { hitoId, codigoCompleto, nombre, descripcion, indicadorMeta, indicadorUnidad, prioridad, fechaInicio, fechaLimite } = req.body;
    const userId = req.user.id;

    // TODO: La asignaciÃ³n de localidad deberÃ­a hacerse mediante endpoints separados o incluir localidadId en el body, 
    // pero por defecto lo crearemos sin asignaciÃ³n o con las localidades existentes si se proveen.
    const nuevaActividad = await prisma.actividad.create({
      data: {
        hitoId,
        codigoCompleto: codigoCompleto || `ACT-${Date.now()}`,
        nombre,
        descripcion,
        indicadorMeta: parseFloat(indicadorMeta) || 0,
        indicadorUnidad: indicadorUnidad || 'Unidades',
        prioridad: prioridad || 'MEDIA',
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
        creadoPor: userId,
        tiposEvidenciaRequeridos: ['documento']
      }
    });

    // Auto-asignar a todas las localidades
    const localidades = await prisma.localidad.findMany();
    if (localidades.length > 0) {
      await prisma.asignacionLocalidad.createMany({
        data: localidades.map(loc => ({
          actividadId: nuevaActividad.id,
          localidadId: loc.id
        }))
      });
    }

    res.status(201).json(nuevaActividad);
  } catch (error) {
    console.error('Error creando actividad:', error);
    res.status(500).json({ error: 'Error creando actividad' });
  }
});

// Importación masiva de Actividades
router.post('/importar', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  const { eliminarActuales, actividades } = req.body;

  try {
    await prisma.$transaction(async (tx) => {
      if (eliminarActuales) {
        await tx.asignacionLocalidad.deleteMany();
        await tx.subTarea.deleteMany();
        await tx.evidencia.deleteMany();
        await tx.comentario.deleteMany();
        await tx.alerta.deleteMany();
        const fichasImp = await tx.fichaAlerta.findMany({ where: { NOT: { actividadId: null } }, select: { id: true } });
        if (fichasImp.length > 0) {
          await tx.actualizacionAlerta.deleteMany({ where: { fichaAlertaId: { in: fichasImp.map(f => f.id) } } });
        }
        await tx.fichaAlerta.deleteMany({ where: { NOT: { actividadId: null } } });
        await tx.historialCambios.deleteMany();
        await tx.actividad.deleteMany();
      }

      if (actividades && Array.isArray(actividades)) {
        for (const act of actividades) {
          const { codigoActividad, aspiracion, producto, nombre, descripcion, fechaInicio, fechaLimite, valorActividad } = act;
          
          if (!codigoActividad || !nombre) {
            throw new Error('El codigo de la actividad y el nombre son obligatorios');
          }

          // Parse Aspiracion
          let objCodigo = "A0";
          let objNombre = aspiracion || "Aspiracion General";
          if (aspiracion && typeof aspiracion === 'string' && aspiracion.includes('.')) {
              objCodigo = aspiracion.split('.')[0].trim();
              objNombre = aspiracion.split('.').slice(1).join('.').trim();
          }

          // Parse Producto
          let progCodigo = "P00";
          let progNombre = producto || "Producto General";
          if (producto && typeof producto === 'string') {
              const match = producto.match(/^([P|p|A-Z0-9]+)\s+(.*)/);
              if (match) {
                 progCodigo = match[1].toUpperCase();
                 progNombre = match[2].trim();
              } else {
                 progCodigo = producto.split(' ')[0].toUpperCase();
                 progNombre = producto;
              }
          }

          // 1. Find or create Plan
          let plan = await tx.plan.findFirst({ where: { estado: 'ACTIVO' } });
          if (!plan) {
             plan = await tx.plan.create({ data: { nombre: 'Plan Estrategico', ano: new Date().getFullYear(), estado: 'ACTIVO', creadoPor: req.user?.id || 'admin' } });
          }

          // 2. Find or create Objetivo (Aspiracion)
          let objetivo = await tx.objetivoEstrategico.findFirst({ where: { planId: plan.id, codigo: objCodigo } });
          if (!objetivo) {
             objetivo = await tx.objetivoEstrategico.create({ data: { planId: plan.id, codigo: objCodigo, nombre: objNombre, orden: 1 } });
          }

          // 3. Find or create Programa (Producto)
          let programa = await tx.programa.findFirst({ where: { objetivoId: objetivo.id, codigo: progCodigo } });
          if (!programa) {
             programa = await tx.programa.create({ data: { objetivoId: objetivo.id, codigo: progCodigo, nombre: progNombre } });
          }

          // 4. Find or create Hito
          let hito = await tx.hito.findFirst({ where: { programaId: programa.id } });
          if (!hito) {
             hito = await tx.hito.create({ data: { programaId: programa.id, codigo: 'H1', nombre: 'Hito General', fechaLimite: new Date() } });
          }

          // Tratar el valorActividad
          let meta = 100;
          if (valorActividad) {
             const v = parseFloat(valorActividad.toString().replace('%', ''));
             if (!isNaN(v)) meta = v;
          }

          await tx.actividad.create({
            data: {
              hitoId: hito.id,
              codigoCompleto: codigoActividad,
              nombre: nombre,
              descripcion: descripcion || null,
              fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
              fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
              indicadorMeta: meta,
              indicadorUnidad: '%',
              prioridad: 'MEDIA',
              creadoPor: req.user?.id || 'admin',
              estado: 'PENDIENTE'
            }
          });
        }
      }
    });

    res.json({ success: true, message: 'Actividades importadas correctamente' });
  } catch (error: any) {
    console.error('Error importando actividades:', error);
    res.status(500).json({ error: error.message || 'Error al importar actividades' });
  }
});

// Eliminar una actividad
router.delete('/:id', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.$transaction(async (tx) => {
      const act = await tx.actividad.findUnique({ where: { id } });
      if (!act) {
        throw new Error('Actividad no encontrada');
      }

      await tx.asignacionLocalidad.deleteMany({ where: { actividadId: id } });
      await tx.subTarea.deleteMany({ where: { actividadId: id } });
      await tx.evidencia.deleteMany({ where: { actividadId: id } });
      await tx.comentario.deleteMany({ where: { actividadId: id } });
      await tx.alerta.deleteMany({ where: { actividadId: id } });
      const fichas = await tx.fichaAlerta.findMany({ where: { actividadId: id }, select: { id: true } });
      if (fichas.length > 0) {
        await tx.actualizacionAlerta.deleteMany({ where: { fichaAlertaId: { in: fichas.map(f => f.id) } } });
      }
      await tx.fichaAlerta.deleteMany({ where: { actividadId: id } });
      await tx.historialCambios.deleteMany({ where: { actividadId: id } });

      await tx.actividad.delete({ where: { id } });
    });

    res.json({ message: 'Actividad eliminada correctamente' });
  } catch (error: any) {
    console.error('Error eliminando actividad:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar actividad' });
  }
});

// Agregar Comentario
router.post('/:id/comentarios', azureADAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { texto, localidadId } = req.body;
    const userId = req.user.id;
    
    let locId = localidadId;
    if (!locId) {
       const asig = await prisma.asignacionLocalidad.findFirst({ where: { actividadId: id } });
       if (asig) locId = asig.localidadId;
    }

    const comentario = await prisma.comentario.create({
      data: {
        texto,
        actividadId: id,
        localidadId: locId,
        autorId: userId
      },
      include: { autor: true }
    });
    res.json(comentario);
  } catch (error) {
    console.error('Error creando comentario:', error);
    res.status(500).json({ error: 'Error creando comentario' });
  }
});

// Cambiar Estado Local de una AsignaciÃ³n
router.patch('/asignacion/:id/estadoLocal', azureADAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { estadoLocal } = req.body;
    const asig = await prisma.asignacionLocalidad.update({
      where: { id },
      data: { estadoLocal }
    });
    res.json(asig);
  } catch (error) {
    console.error('Error actualizando estado local:', error);
    res.status(500).json({ error: 'Error actualizando estado local' });
  }
});

// Cambiar Estado ValidaciÃ³n de una AsignaciÃ³n (Solo ADMIN)
router.patch('/asignacion/:id/estadoValidacion', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { estadoValidacion } = req.body;
    
    // Si validan como COMPLETADA, cerramos tambiÃ©n el estadoLocal para que quede todo sincronizado
    let updateData: any = { estadoValidacion };
    if (estadoValidacion === 'VALIDADA_COMPLETADA') {
       updateData.estadoLocal = 'COMPLETA_SIN_VALIDAR'; // O dejarlo en algo que indique cerrado
    }

    const asig = await prisma.asignacionLocalidad.update({
      where: { id },
      data: updateData
    });
    res.json(asig);
  } catch (error) {
    console.error('Error actualizando estado validacion:', error);
    res.status(500).json({ error: 'Error actualizando estado de validaciÃ³n' });
  }
});

// Actualizar DescripciÃ³n (y otras propiedades) de Actividad
router.patch('/:id', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { descripcion, fechaInicio, fechaLimite, nombre, hitoId, codigoCompleto } = req.body;
    
    const dataToUpdate: any = {};
    if (descripcion !== undefined) dataToUpdate.descripcion = descripcion;
    if (fechaInicio !== undefined) dataToUpdate.fechaInicio = fechaInicio ? new Date(fechaInicio) : null;
    if (fechaLimite !== undefined) dataToUpdate.fechaLimite = fechaLimite ? new Date(fechaLimite) : null;
    if (nombre !== undefined) dataToUpdate.nombre = nombre;
    if (hitoId !== undefined) dataToUpdate.hitoId = hitoId;
    if (codigoCompleto !== undefined) dataToUpdate.codigoCompleto = codigoCompleto;

    const actividad = await prisma.actividad.update({
      where: { id },
      data: dataToUpdate
    });
    res.json(actividad);
  } catch (error) {
    console.error('Error actualizando actividad:', error);
    res.status(500).json({ error: 'Error actualizando actividad' });
  }
});

export default router;
