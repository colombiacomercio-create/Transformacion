"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const planes_routes_1 = __importDefault(require("./routes/planes.routes"));
const alertas_routes_1 = __importDefault(require("./routes/alertas.routes"));
const evidencias_routes_1 = __importDefault(require("./routes/evidencias.routes"));
const cortes_routes_1 = __importDefault(require("./routes/cortes.routes"));
const fichas_alertas_routes_1 = __importDefault(require("./routes/fichas-alertas.routes"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../../uploads')));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/planes', planes_routes_1.default);
// Endpoint temporal de actividades (sin autenticación, solo mock)
const db_1 = require("./db");
app.get('/api/actividades', async (req, res) => {
    try {
        const { data, error } = await db_1.supabase
            .from('Actividad')
            .select('*');
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        console.error('Error:', error);
        res.json([]);
    }
});
app.use('/api/alertas', alertas_routes_1.default);
app.use('/api/evidencias', evidencias_routes_1.default);
app.use('/api/cortes', cortes_routes_1.default);
app.use('/api/fichas-alertas', fichas_alertas_routes_1.default);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend funciona', timestamp: new Date() });
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Backend de Transformación corriendo en el puerto ${PORT}`);
});
