import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import planesRoutes from './routes/planes.routes';
import alertasRoutes from './routes/alertas.routes';
import evidenciasRoutes from './routes/evidencias.routes';
import cortesRoutes from './routes/cortes.routes';
import fichasAlertasRoutes from './routes/fichas-alertas.routes';
import actividadesRoutes from './routes/actividades.routes';
import fichaResultadosRoutes from './routes/ficha-resultados.routes';
import reunionesRoutes from './routes/reuniones.routes';
import informesRoutes from './routes/informes.routes';
import eventosRoutes from './routes/eventos.routes';
import normativoRoutes from './routes/normativo.routes';
import otrosEspaciosRoutes from './routes/otros-espacios.routes';
import path from 'path';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/planes', planesRoutes);
app.use('/api/actividades', actividadesRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/evidencias', evidenciasRoutes);
app.use('/api/cortes', cortesRoutes);
app.use('/api/fichas-alertas', fichasAlertasRoutes);
app.use('/api/ficha-resultados', fichaResultadosRoutes);
app.use('/api/reuniones', reunionesRoutes);
app.use('/api/informes', informesRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/normativo', normativoRoutes);
app.use('/api/otros-espacios', otrosEspaciosRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funciona v2', timestamp: new Date() });
});

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend de Transformación corriendo en el puerto ${PORT}`);
  });
}

module.exports = app;