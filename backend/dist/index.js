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
const actividades_routes_1 = __importDefault(require("./routes/actividades.routes"));
const ficha_resultados_routes_1 = __importDefault(require("./routes/ficha-resultados.routes"));
const reuniones_routes_1 = __importDefault(require("./routes/reuniones.routes"));
const informes_routes_1 = __importDefault(require("./routes/informes.routes"));
const eventos_routes_1 = __importDefault(require("./routes/eventos.routes"));
const normativo_routes_1 = __importDefault(require("./routes/normativo.routes"));
const otros_espacios_routes_1 = __importDefault(require("./routes/otros-espacios.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const obras_routes_1 = __importDefault(require("./routes/obras.routes"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../../uploads')));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/planes', planes_routes_1.default);
app.use('/api/actividades', actividades_routes_1.default);
app.use('/api/alertas', alertas_routes_1.default);
app.use('/api/evidencias', evidencias_routes_1.default);
app.use('/api/cortes', cortes_routes_1.default);
app.use('/api/fichas-alertas', fichas_alertas_routes_1.default);
app.use('/api/ficha-resultados', ficha_resultados_routes_1.default);
app.use('/api/reuniones', reuniones_routes_1.default);
app.use('/api/informes', informes_routes_1.default);
app.use('/api/eventos', eventos_routes_1.default);
app.use('/api/normativo', normativo_routes_1.default);
app.use('/api/otros-espacios', otros_espacios_routes_1.default);
app.use('/api/ia', ai_routes_1.default);
app.use('/api/obras', obras_routes_1.default);
const client_1 = require("@prisma/client");
const prismaClient = new client_1.PrismaClient();
app.get('/api/localidades', async (req, res) => {
    try {
        const list = await prismaClient.localidad.findMany();
        res.json(list);
    }
    catch (err) {
        console.error('Error in /api/localidades:', err);
        res.status(500).json({ error: 'Error interno obteniendo localidades' });
    }
});
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
