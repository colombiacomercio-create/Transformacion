"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var fs = require("fs");
var path = require("path");
var dotenv = require("dotenv");
dotenv.config();
var prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL
        }
    }
});
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var csvData, plan, objetivo, programa, lines, parsedRows, _i, lines_1, line, row, current, inQuotes, i, char, localidadName, hitoName, actCodigo, actNombre, fechaInicio, fechaFin, valor, progresoRaw, estadoLocal, estadoValidacion, progreso, grouped, _a, parsedRows_1, row, key, localidades, locMap, _b, _c, _d, key, rows, _e, localidadName, hitoName, actNombre, locId, hito, totalIndicador, isRepetitive, i, row, finalActNombre, actCodigo, newAct, existingAsig;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    console.log("Iniciando importación...");
                    csvData = fs.readFileSync(path.join(__dirname, 'data.csv'), 'utf-8');
                    // Create or find Plan
                    console.log.apply(console, __spreadArray([Fetching, plan], , false));
                    return [4 /*yield*/, prisma.plan.findFirst({ where: { nombre: 'Plan de Desarrollo 2024-2028' } })];
                case 1:
                    plan = _f.sent();
                    if (!!plan) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma.plan.create({
                            data: { nombre: 'Plan de Desarrollo 2024-2028', ano: 2024, creadoPor: 'SYSTEM' }
                        })];
                case 2:
                    plan = _f.sent();
                    _f.label = 3;
                case 3:
                    // Create or find ObjetivoEstrategico
                    console.log.apply(console, __spreadArray([Fetching, objetivo], , false));
                    return [4 /*yield*/, prisma.objetivoEstrategico.findFirst({ where: { codigo: 'A5' } })];
                case 4:
                    objetivo = _f.sent();
                    if (!!objetivo) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma.objetivoEstrategico.create({
                            data: { codigo: 'A5', nombre: 'A5: Ciudadanía y Participación', orden: 5, planId: plan.id }
                        })];
                case 5:
                    objetivo = _f.sent();
                    _f.label = 6;
                case 6:
                    // Create or find Programa
                    console.log.apply(console, __spreadArray([Fetching, programa], , false));
                    return [4 /*yield*/, prisma.programa.findFirst({ where: { codigo: 'P08' } })];
                case 7:
                    programa = _f.sent();
                    if (!!programa) return [3 /*break*/, 9];
                    return [4 /*yield*/, prisma.programa.create({
                            data: {
                                codigo: 'P08',
                                nombre: 'P08. Rollos Legendarios',
                                objetivoId: objetivo.id
                            }
                        })];
                case 8:
                    programa = _f.sent();
                    _f.label = 9;
                case 9:
                    console.log.apply(console, __spreadArray([Parsing, CSV], , false));
                    lines = csvData.split('\n').filter(function (l) { return l.trim() !== ''; });
                    parsedRows = [];
                    for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                        line = lines_1[_i];
                        row = [];
                        current = '';
                        inQuotes = false;
                        for (i = 0; i < line.length; i++) {
                            char = line[i];
                            if (char === '"' && line[i + 1] === '"') {
                                current += '"';
                                i++;
                            }
                            else if (char === '"') {
                                inQuotes = !inQuotes;
                            }
                            else if (char === ',' && !inQuotes) {
                                row.push(current);
                                current = '';
                            }
                            else {
                                current += char;
                            }
                        }
                        row.push(current);
                        localidadName = row[1];
                        hitoName = row[2];
                        actCodigo = row[3];
                        actNombre = row[4];
                        fechaInicio = row[5] ? new Date(row[5]) : null;
                        fechaFin = row[6] ? new Date(row[6]) : new Date();
                        valor = parseFloat(row[7]) || 0;
                        progresoRaw = row[8] ? row[8].trim() : '';
                        estadoLocal = 'NO_INICIADA';
                        estadoValidacion = 'PENDIENTE_REVISION';
                        progreso = 0;
                        if (progresoRaw.toLowerCase() === 'completado') {
                            estadoLocal = 'COMPLETA_SIN_VALIDAR';
                            estadoValidacion = 'VALIDADA_COMPLETADA';
                            progreso = 100;
                        }
                        else if (progresoRaw.toLowerCase() === 'en curso') {
                            estadoLocal = 'EN_CURSO_SIN_VALIDAR';
                            estadoValidacion = 'PENDIENTE_REVISION';
                            progreso = 50;
                        }
                        parsedRows.push({
                            localidadName: localidadName,
                            hitoName: hitoName,
                            actCodigo: actCodigo,
                            actNombre: actNombre,
                            fechaInicio: fechaInicio,
                            fechaFin: fechaFin,
                            valor: valor,
                            estadoLocal: estadoLocal,
                            estadoValidacion: estadoValidacion,
                            progreso: progreso
                        });
                    }
                    grouped = new Map();
                    for (_a = 0, parsedRows_1 = parsedRows; _a < parsedRows_1.length; _a++) {
                        row = parsedRows_1[_a];
                        key = "".concat(row.localidadName, "|").concat(row.hitoName, "|").concat(row.actNombre);
                        if (!grouped.has(key)) {
                            grouped.set(key, []);
                        }
                        grouped.get(key).push(row);
                    }
                    return [4 /*yield*/, prisma.localidad.findMany()];
                case 10:
                    localidades = _f.sent();
                    locMap = new Map(localidades.map(function (l) { return [l.nombre, l.id]; }));
                    console.log.apply(console, __spreadArray(__spreadArray([Iterating, grouped], size, false), [+grouped.size], false));
                    _b = 0, _c = Array.from(grouped.entries());
                    _f.label = 11;
                case 11:
                    if (!(_b < _c.length)) return [3 /*break*/, 23];
                    _d = _c[_b], key = _d[0], rows = _d[1];
                    _e = key.split('|'), localidadName = _e[0], hitoName = _e[1], actNombre = _e[2];
                    locId = locMap.get(localidadName);
                    if (!locId) {
                        console.log("Localidad no encontrada: ".concat(localidadName));
                        return [3 /*break*/, 22];
                    }
                    return [4 /*yield*/, prisma.hito.findFirst({
                            where: {
                                nombre: hitoName,
                                programaId: programa.id
                            }
                        })];
                case 12:
                    hito = _f.sent();
                    if (!!hito) return [3 /*break*/, 14];
                    return [4 /*yield*/, prisma.hito.create({
                            data: {
                                nombre: hitoName,
                                codigo: hitoName.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
                                programaId: programa.id,
                                fechaLimite: new Date('2028-12-31')
                            }
                        })];
                case 13:
                    hito = _f.sent();
                    _f.label = 14;
                case 14:
                    totalIndicador = rows.reduce(function (sum, r) { return sum + r.valor; }, 0);
                    console.log(Upserting, acts);
                    for (+hitoName;;)
                        ;
                    isRepetitive = rows.length > 1;
                    i = 0;
                    _f.label = 15;
                case 15:
                    if (!(i < rows.length)) return [3 /*break*/, 22];
                    row = rows[i];
                    finalActNombre = isRepetitive ? "".concat(actNombre, " (Repetici\u00F3n ").concat(i + 1, "/").concat(rows.length, ")") : actNombre;
                    actCodigo = isRepetitive ? "".concat(row.actCodigo, "-").concat(i + 1) : row.actCodigo;
                    // Upsert activity just in case it already exists
                    console.log(Upserting, +actCodigo);
                    return [4 /*yield*/, prisma.actividad.upsert({
                            where: { codigoCompleto: actCodigo },
                            create: {
                                nombre: finalActNombre,
                                codigoCompleto: actCodigo,
                                hitoId: hito.id,
                                fechaInicio: row.fechaInicio,
                                fechaLimite: row.fechaFin,
                                indicadorMeta: totalIndicador,
                                indicadorUnidad: 'Porcentaje',
                                creadoPor: 'SYSTEM'
                            },
                            update: {
                                nombre: finalActNombre,
                                fechaInicio: row.fechaInicio,
                                fechaLimite: row.fechaFin,
                                indicadorMeta: totalIndicador,
                            }
                        })];
                case 16:
                    newAct = _f.sent();
                    return [4 /*yield*/, prisma.asignacionLocalidad.findUnique({
                            where: {
                                actividadId_localidadId: {
                                    actividadId: newAct.id,
                                    localidadId: locId
                                }
                            }
                        })];
                case 17:
                    existingAsig = _f.sent();
                    if (!!existingAsig) return [3 /*break*/, 19];
                    return [4 /*yield*/, prisma.asignacionLocalidad.create({
                            data: {
                                actividadId: newAct.id,
                                localidadId: locId,
                                estadoLocal: row.estadoLocal,
                                estadoValidacion: row.estadoValidacion,
                                porcentajeAvance: row.progreso,
                            }
                        })];
                case 18:
                    _f.sent();
                    return [3 /*break*/, 21];
                case 19: return [4 /*yield*/, prisma.asignacionLocalidad.update({
                        where: { id: existingAsig.id },
                        data: {
                            estadoLocal: row.estadoLocal,
                            estadoValidacion: row.estadoValidacion,
                            porcentajeAvance: row.progreso,
                        }
                    })];
                case 20:
                    _f.sent();
                    _f.label = 21;
                case 21:
                    i++;
                    return [3 /*break*/, 15];
                case 22:
                    _b++;
                    return [3 /*break*/, 11];
                case 23:
                    console.log("Importación de Rollos Legendarios finalizada con éxito.");
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (e) {
    console.error(e);
    process.exit(1);
}).finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
