import { enviarNotificacion } from '../services/mail.service';
﻿import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, AuthRequest, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.get('/', azureADAuth, async (req: Request, res: Response) => {
  try {
    const actividadesRaw = await prisma.actividad.findMany({
        include: {
          hito: { include: { programa: { include: { objetivo: true } } } },
          asignaciones: { include: { localidad: true, responsable: true } },
          evidencias: { include: { subidoPor: true } },
          comentarios: { include: { autor: true } }
        }
      });
      
      const userIds = [...new Set(actividadesRaw.map(a => a.creadoPor).filter(id => id && id !== 'SYSTEM'))];
      const users = await prisma.usuario.findMany({ where: { id: { in: userIds } } });
      const userMap = new Map(users.map(u => [u.id, u.nombre]));
      
      const actividades = actividadesRaw.map(a => ({
          ...a,
          nombreCreador: a.creadoPor === 'SYSTEM' ? 'Sistema / Importaci\u00f3n' : (userMap.get(a.creadoPor) || 'Usuario Desconocido')
      }));

      res.json(actividades);
  } catch (error) {
    console.error('Error fetching actividades:', error);
    res.status(500).json({ error: 'Error fetching actividades' });
  }
});

// Crear Actividad
router.post('/', azureADAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { 
      hitoId, codigoCompleto, nombre, descripcion, indicadorMeta, indicadorUnidad, 
      prioridad, fechaInicio, fechaLimite,
      crearNuevoProducto, crearNuevaAspiracion,
      nuevoProductoCodigo, nuevoProductoNombre,
      aspiracionId, nuevaAspiracionCodigo, nuevaAspiracionNombre,
      localidadesIds, // array of strings
      esRepetitiva,
      numRepeticiones,
      fechasLimites
    } = req.body;
    const userId = req.user.id;
    
    let finalHitoId = hitoId;
    let baseProductCode = "P00";
    
    // Si se est\u00e1 creando un producto nuevo desde la UI
    if (crearNuevoProducto) {
       let targetAspiracionId = aspiracionId;
       
       if (crearNuevaAspiracion) {
          let plan = await prisma.plan.findFirst({ where: { estado: 'ACTIVO' } });
          if (!plan) plan = await prisma.plan.create({ data: { nombre: 'Plan Estrat\u00e9gico', ano: new Date().getFullYear(), estado: 'ACTIVO', creadoPor: userId } });
          
          const nuevaAsp = await prisma.objetivoEstrategico.create({
             data: { planId: plan.id, codigo: nuevaAspiracionCodigo, nombre: nuevaAspiracionNombre, orden: 99 }
          });
          targetAspiracionId = nuevaAsp.id;
       }
       
       const nuevoProg = await prisma.programa.create({
          data: { objetivoId: targetAspiracionId, codigo: nuevoProductoCodigo, nombre: nuevoProductoNombre }
       });
       baseProductCode = nuevoProductoCodigo;
       
       const nuevoHito = await prisma.hito.create({
          data: { programaId: nuevoProg.id, codigo: 'H1', nombre: 'General', fechaLimite: fechaLimite ? new Date(fechaLimite) : new Date() }
       });
       finalHitoId = nuevoHito.id;
    } else {
       // Buscar el c\u00f3digo del producto para autogenerar
       const existingHito = await prisma.hito.findUnique({ where: { id: finalHitoId }, include: { programa: true } });
       if (existingHito) {
           baseProductCode = existingHito.programa.codigo;
       }
    }

    const repeticionesCount = (esRepetitiva && numRepeticiones > 1) ? parseInt(numRepeticiones) : 1;
    const metaPerAct = (parseFloat(indicadorMeta) || 0) / repeticionesCount;
    
    // Conteo para autogenerar c\u00f3digos secuenciales
    const conteo = await prisma.actividad.count({
        where: { hitoId: finalHitoId }
    });
    
    let baseCode = codigoCompleto;
    if (!baseCode) {
        baseCode = `${baseProductCode}.${conteo + 1}`;
    }
    
    let primaryActividad = null;

    for (let i = 0; i < repeticionesCount; i++) {
        let currentCode = baseCode;
        let currentName = nombre;
        
        let currentFechaLimite = fechaLimite ? new Date(fechaLimite) : null;
        if (fechasLimites && Array.isArray(fechasLimites) && fechasLimites[i]) {
            currentFechaLimite = new Date(fechasLimites[i]);
        }

        if (repeticionesCount > 1) {
            currentCode = `${baseCode}-${i + 1}`;
            currentName = `${nombre} (Repetici\u00f3n ${i + 1}/${repeticionesCount})`;
        }

        const act = await prisma.actividad.create({
          data: {
            hitoId: finalHitoId,
            codigoCompleto: currentCode,
            nombre: currentName,
            descripcion,
            indicadorMeta: metaPerAct,
            indicadorUnidad: indicadorUnidad || 'Unidades',
            prioridad: prioridad || 'MEDIA',
            fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
            fechaLimite: currentFechaLimite,
            creadoPor: userId,
            tiposEvidenciaRequeridos: ['documento']
          }
        });
        
        if (i === 0) primaryActividad = act;

        // Asignar localidades
        let targetLocs = [];
        if (localidadesIds && Array.isArray(localidadesIds) && localidadesIds.length > 0) {
            targetLocs = localidadesIds;
        } else {
            // Si no mandan nada, quiz\u00e1s quieran todas (o ninguna). Para retrocompatibilidad y requerimiento: "No todas se repiten, pueden ser \u00fanicas"
            // Let's assume if it's empty, they meant NONE. But wait, if they don't select, it won't show in the kanban.
            // Let's get ALL if empty to be safe, or just what they select.
            const allLocs = await prisma.localidad.findMany();
            targetLocs = allLocs.map(l => l.id);
        }

        if (targetLocs.length > 0) {
          await prisma.asignacionLocalidad.createMany({
            data: targetLocs.map(lId => ({
              actividadId: act.id,
              localidadId: lId
            }))
          });
          
          // Enviar correo a los responsables de las localidades asignadas
          for (const lId of targetLocs) {
              const usuariosLoc = await prisma.usuario.findMany({ where: { localidades: { some: { id: lId } } } });
              const correosLoc = usuariosLoc.map(u => u.email).filter(e => e);
              if (correosLoc.length > 0) {
                  await enviarNotificacion(
                      correosLoc,
                      `Nueva Actividad Asignada: ${act.nombre}`,
                      `Se te ha asignado una nueva actividad en el sistema Transformaci\u00f3n Bogot\u00e1:<br><br><b>Actividad:</b> ${act.nombre}<br><b>C\u00f3digo:</b> ${act.codigoCompleto}<br><br>Por favor ingresa a la plataforma para revisarla.`
                  );
              }
          }
        }
    }

    res.status(201).json(primaryActividad);
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
            const { codigoActividad, aspiracion, producto, nombre, descripcion, fechaInicio, fechaLimite, valorActividad, esRepetitiva, numRepeticiones, fechasLimites } = act;
            
            if (!nombre) {
              throw new Error('El nombre de la actividad es obligatorio');
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
        data: { estadoLocal },
        include: { actividad: true, localidad: true }
      });
      
      // Notificar a los administradores
      const admins = await prisma.usuario.findMany({ where: { rol: 'ADMIN' } });
      const correosAdmins = admins.map(a => a.email).filter(e => e);
      if (correosAdmins.length > 0) {
          await enviarNotificacion(
              correosAdmins, 
              `Actividad actualizada por Localidad: ${asig.actividad.nombre}`, 
              `La localidad <b>${asig.localidad.nombre}</b> ha cambiado el estado de la actividad a <b>${estadoLocal}</b>.<br><br>Por favor revisa la plataforma.`
          );
      }
      
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
      
      const asigCurrent = await prisma.asignacionLocalidad.findUnique({
          where: { id },
          include: { actividad: true }
      });

      if (!asigCurrent) {
          return res.status(404).json({ error: 'Asignaci\u00f3n no encontrada' });
      }

      let updateData: any = { estadoValidacion };
      
      // Calculate score (porcentajeAvance) based on the validation status
      const meta = asigCurrent.actividad.indicadorMeta || 0;
      if (estadoValidacion === 'VALIDADA_SIN_AVANCE') {
          updateData.porcentajeAvance = 0;
      } else if (estadoValidacion === 'VALIDADA_EN_CURSO') {
          updateData.porcentajeAvance = meta * 0.5;
      } else if (estadoValidacion === 'VALIDADA_COMPLETADA') {
          updateData.porcentajeAvance = meta;
          updateData.estadoLocal = 'COMPLETA_SIN_VALIDAR';
      }

      const asig = await prisma.asignacionLocalidad.update({
        where: { id },
        data: updateData,
        include: { actividad: true, localidad: true }
      });
      
      // Notificar a los responsables de la localidad
      const usuariosLoc = await prisma.usuario.findMany({ where: { localidades: { some: { id: asig.localidadId } } } });
      const correosLoc = usuariosLoc.map(u => u.email).filter(e => e);
      if (correosLoc.length > 0) {
          await enviarNotificacion(
              correosLoc,
              `Actividad Validada por Admin: ${asig.actividad.nombre}`,
              `Un administrador ha cambiado el estado de revisi\u00f3n de tu actividad a <b>${estadoValidacion}</b> con un avance del ${updateData.porcentajeAvance || 0}%.<br><br>Revisa la plataforma para m\u00e1s detalles.`
          );
      }
      
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
