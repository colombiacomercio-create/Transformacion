import { Router } from 'express';
import { azureADAuth, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// Este endpoint es llamado por el frontend inmediatamente después del login con MSAL
// para obtener el rol, la localidad asignada y permisos del usuario desde nuestra BD Postgres.
router.get('/me', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    res.json({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo perfil del usuario.' });
  }
});

export default router;
