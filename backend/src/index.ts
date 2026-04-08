import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import planesRoutes from './routes/planes.routes';
import actividadesRoutes from './routes/actividades.routes';
import alertasRoutes from './routes/alertas.routes';
import evidenciasRoutes from './routes/evidencias.routes';
import cortesRoutes from './routes/cortes.routes';
import fichasAlertasRoutes from './routes/fichas-alertas.routes';
import path from 'path';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servidor estático para uploads locales
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/planes', planesRoutes);
app.use('/api/actividades', actividadesRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/evidencias', evidenciasRoutes);
app.use('/api/cortes', cortesRoutes);
app.use('/api/fichas-alertas', fichasAlertasRoutes);

// Endpoint de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend de Transformación corriendo en el puerto ${PORT}`);
});
