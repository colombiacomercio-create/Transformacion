import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { azureADAuth, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

export interface PuntoRaw {
  id: string;
  ld: string;          // Localidad
  t: 'T1' | 'T2';      // Trimestre
  d: string;           // Dirección del punto
  cls: 'S' | 'A' | 'N' | 'RI' | 'V'; // Clase
  prod: 'P04' | 'P05';
  isp: number | null;
  riesgo: string;
  fecha: string;
  reporta?: string;
  dependencia?: string;
  descripcion?: string;
  recomendacion?: string;
  criteriosDetalle?: { k: string; v: string; ok: boolean }[];
  evidencias?: { label: string; file: string; url?: string; contentType?: string }[];
  lat?: number;
  lng?: number;
}

export interface VocacionP05Item {
  label: string;
  icon: 'ventas' | 'parqueo';
  total: number;
  sost: number;
  s: number;
  a: number;
  n: number;
  pct: number;
}

export interface CondicionP05Item {
  label: string;
  totalPct: number;
  parcialPct: number;
  noPct: number;
  avancePct: number;
  avanceN: number;
  totalN: number;
}

export interface SostenibilidadDatos {
  periodoVisita: string;
  totalRespuestas: number;
  totalPriorizadosP04: number;
  totalPriorizadosP05: number;
  puntosP04: PuntoRaw[];
  puntosP05: PuntoRaw[];
  criteriosP04: { label: string; ok: number; n?: number; color: string }[];
  criteriosP05: { label: string; ok: number; n?: number; color: string }[];
  vocacionP05?: VocacionP05Item[];
  condicionesP05?: CondicionP05Item[];
  riesgosP04: { label: string; n: number; w: number }[];
  riesgosP05: { label: string; n: number; w: number }[];
  apropiacionP04: { label: string; pct: number | null; n?: number; color: string }[];
  apropiacionP05: { label: string; pct: number | null; n?: number; color: string }[];
  notaTablaP04: string;
  notaTablaP05: string;
  cobertura: { label: string; pct: number; color: string }[];
  reglas: { titulo: string; texto: string }[];
  conciliado: { tag: string; bg: string; fg: string; t: string }[];
}

const RAW_P04: [string, 'T1' | 'T2', string, 'S' | 'A' | 'N' | 'RI' | 'V', number | null, string, string][] = [
  ['Usaquén','T1','Calle 161 con Carrera 8','S',84,'Reincidencia de arrojo','12 oct 2026, 08:35'],
  ['Usaquén','T2','Calle 163A con Carrera 9','S',88,'Ausencia de mantenimiento','12 oct 2026, 09:20'],
  ['Usaquén','T2','Calle 189B con Carrera 4','S',82,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['Chapinero','T1','Carrera 13A con Calle 97','S',90,'Reincidencia de arrojo','13 oct 2026, 08:10'],
  ['Chapinero','T2','Calle 77 con Autopista Norte','S',86,'Falta de apropiación comunitaria','13 oct 2026, 10:45'],
  ['Chapinero','T2','Avenida Caracas con Calle 40C','S',81,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['Santa Fe','T1','Las Cruces — Calle 2A # 4-31','S',92,'Reincidencia de arrojo','14 oct 2026, 07:55'],
  ['Santa Fe','T2','Av. Caracas con Calle 13','S',83,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['San Cristóbal','T1','Transversal 14B Este con Calle 57 Sur ("El Parchadero")','S',87,'Reincidencia de arrojo','14 oct 2026, 09:30'],
  ['San Cristóbal','T2','Calle 41 Sur con Carrera 13B Este','A',72,'Ausencia de mantenimiento','14 oct 2026, 11:05'],
  ['San Cristóbal','T2','Calle 39C Sur con Carrera 2D Bis','S',85,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['Usme','T1','Marichuela','A',66,'Reincidencia de arrojo','15 oct 2026, 08:15'],
  ['Usme','T1','Colegio Ciudad Villavicencio sede C','S',89,'Disposición de RCD por terceros','15 oct 2026, 09:40'],
  ['Usme','T2','Calle 74B Sur con Carrera 14U','A',78,'Reincidencia de arrojo','15 oct 2026, 11:20'],
  ['Usme','T2','Calle 57 Sur # 3B-05','S',80,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['Tunjuelito','T1','Barrio San Carlos — Carrera 18C con Calle 55 Sur','A',70,'Ausencia de mantenimiento','15 oct 2026, 14:05'],
  ['Tunjuelito','T2','Carrera 19 # 56A-20','N',44,'Reincidencia de arrojo','15 oct 2026, 15:30'],
  ['Bosa','T1','Calle 71A con Carrera 82','S',84,'Reincidencia de arrojo','16 oct 2026, 08:00'],
  ['Bosa','T2','Av. Tintal con Calle 49D Sur','A',74,'Disposición de RCD por terceros','16 oct 2026, 09:25'],
  ['Bosa','T2','Calle 55 Sur con Carrera 87D','N',58,'Reincidencia de arrojo','16 oct 2026, 10:50'],
  ['Bosa','T2','Calle 57A Sur con Carrera 94A','V',null,'Sin dato','—'],
  ['Kennedy','T1','UPZ Timiza — Barrio Las Luces — Carrera 77H entre Cl 52A Sur y 51A Sur','S',88,'Ausencia de mantenimiento','14 oct 2026, 08:40'],
  ['Kennedy','T2','Carrera 81K con Calle 40B Sur','A',68,'Reincidencia de arrojo','17 oct 2026, 09:20'],
  ['Kennedy','T2','Calle 32C con Transversal 73F','N',40,'Reincidencia de arrojo','16 oct 2026, 10:05'],
  ['Kennedy','T2','Carrera 85 con Calle 41A','V',null,'Sin dato','—'],
  ['Kennedy','T2','Calle 2 con Carrera 87D','S',82,'Disposición de RCD por terceros','15 oct 2026, 14:10'],
  ['Kennedy','T2','Calle 58A Sur con Carrera 81','A',76,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['Kennedy','T2','Colegio Saludcoop Sur','N',62,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['Fontibón','T1','Calle 20 con cra 103','V',null,'Sin dato','—'],
  ['Fontibón','T2','Av. Calle 24 con Carrera 104','S',90,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['Engativá','T1','Barrio Luis Carlos Galán — Av. Carrera 91 # 97-19','A',65,'Falta de apropiación comunitaria','17 oct 2026, 10:00'],
  ['Engativá','T2','Calle 66 # 69-27','N',51,'Reincidencia de arrojo','17 oct 2026, 11:35'],
  ['Engativá','T2','Calle 73 con Carrera 69J','V',null,'Sin dato','—'],
  ['Suba','T1','Parque Bilbao — Calle 144 # 143','A',79,'Ausencia de mantenimiento','18 oct 2026, 09:45'],
  ['Suba','T1','Ronda de río — Pondaje Cafam UPL Tibabuyes — Calle 142 # 150','N',46,'Reincidencia de arrojo','15 oct 2026, 09:45'],
  ['Suba','T2','Calle 139 # 98B-41','V',null,'Sin dato','—'],
  ['Suba','T2','Carrera 91 # 130A','S',81,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['Barrios Unidos','T1','Colegio Tomás Carrasquilla','A',71,'Ausencia de mantenimiento','13 oct 2026, 14:20'],
  ['Barrios Unidos','T2','Parque Muequetá — Calle 64 # 19','N',38,'Falta de apropiación comunitaria','13 oct 2026, 15:45'],
  ['Barrios Unidos','T2','Calle 75 # 55-03','V',null,'Sin dato','—'],
  ['Teusaquillo','T1','Av. Caracas con Calle 58A','S',92,'Reincidencia de arrojo','13 oct 2026, 16:30'],
  ['Teusaquillo','T2','Calle 26 con Carrera 38A','A',67,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['Los Mártires','T1','Sector nueva sede Alcaldía de Mártires','N',54,'Reincidencia de arrojo','19 oct 2026, 08:05'],
  ['Los Mártires','T1','Av. Ferrocarril de Occidente con Carrera 27','V',null,'Sin dato','—'],
  ['Los Mártires','T2','Calle 5C con Carrera 19','S',83,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['Antonio Nariño','T1','Calle 11 Sur con Carrera 24A — Restrepo Occidental','A',73,'Reincidencia de arrojo','19 oct 2026, 10:55'],
  ['Antonio Nariño','T2','Transversal 24I # 14A-71 Sur','N',60,'Ausencia de mantenimiento','19 oct 2026, 12:10'],
  ['Antonio Nariño','T2','Carrera 27 # 11 Sur','V',null,'Sin dato','—'],
  ['Puente Aranda','T1','Carrera 36 entre Calles 3 y 2, costado occidental','S',87,'Falta de apropiación comunitaria','16 oct 2026, 15:40'],
  ['Puente Aranda','T2','Av. Primero de Mayo con Carrera 39','A',72,'Reincidencia de arrojo','16 oct 2026, 17:15'],
  ['Puente Aranda','T2','Calle 29 Sur con Carrera 39','N',42,'Ausencia de mantenimiento','16 oct 2026, 19:02'],
  ['La Candelaria','T1','Calle 6 con Carrera 2 (conjunta con Santa Fe) — propuesta','V',null,'Sin dato','—'],
  ['La Candelaria','T2','Carrera 4 Este con Calle 10','S',85,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['Rafael Uribe Uribe','T1','Barrio Lomas — Calle 40 Sur con Carrera 10','A',66,'Ausencia de mantenimiento','20 oct 2026, 09:40'],
  ['Rafael Uribe Uribe','T2','Carrera 3B con Calle 48X Bis Sur','N',56,'Reincidencia de arrojo','20 oct 2026, 10:55'],
  ['Ciudad Bolívar','T1','Av. Boyacá con Calle 73A Bis Sur','V',null,'Sin dato','—'],
  ['Ciudad Bolívar','T2','Carrera 48 con Calle 68 Sur','S',89,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['Ciudad Bolívar','T2','Carrera 16C # 61A-45 Sur','A',78,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['Sumapaz','T1','Limpieza y embellecimiento — Santa Rosa / sector Bodegas','N',48,'Reincidencia de arrojo','16 oct 2026, 10:00'],
  ['Sumapaz','T2','Vereda Santa Rosa — Sector Placitas','V',null,'Sin dato','—']
];

const RAW_P05: [string, 'T1' | 'T2', string, 'S' | 'A' | 'N' | 'RI' | 'V', number | null, string, string][] = [
  ['Usaquén','T1','Calle 140 con Carrera 11','S',84,'Retorno de ventas informales','12 oct 2026, 09:10'],
  ['Usaquén','T2','Plaza fundacional — Carrera 6A entre Calles 116 Bis y 119','S',88,'Retorno de ventas informales','12 oct 2026, 10:35'],
  ['Usaquén','T2','Calle 125 entre Autopista Norte y Carrera 19','S',82,'Parqueo indebido','12 oct 2026, 11:50'],
  ['Usaquén','T2','Calle 106 con Carrera 15','S',90,'Retorno de ventas informales','12 oct 2026, 14:20'],
  ['Usaquén','T2','Carrera 19 con Calles 145 a 152','S',86,'Ventas informales','16 oct 2026, 10:00'],
  ['Chapinero','T1','Estación TransMilenio Calle 72','S',81,'Retorno de ventas informales','13 oct 2026, 09:05'],
  ['Chapinero','T2','Estación TransMilenio Calle 57 — temporal','S',92,'Retorno de ventas informales','13 oct 2026, 10:20'],
  ['Santa Fe','T1','Plazoleta San Francisco — Carrera 7 con Calle 15','S',83,'Retorno de ventas informales','14 oct 2026, 08:45'],
  ['Santa Fe','T2','Parque Santander','S',87,'Ventas informales','16 oct 2026, 10:00'],
  ['San Cristóbal','T1','Carrera 8 con Calle 27 Sur','S',85,'Retorno de ventas informales','14 oct 2026, 10:15'],
  ['San Cristóbal','T2','Proyecto cable aéreo','S',89,'Falta de apropiación comunitaria','14 oct 2026, 11:40'],
  ['San Cristóbal','T2','Parque del 20 de Julio','S',80,'Ventas informales','16 oct 2026, 10:00'],
  ['San Cristóbal','T1','Plaza de mercado 20 de Julio — ingreso y salida peatonal','V',null,'Sin dato','—'],
  ['Usme','T1','Calle 137 Sur # 11C-17','S',84,'Retorno de ventas informales','15 oct 2026, 08:30'],
  ['Usme','T2','Centro comercial Altavista','V',null,'Sin dato','—'],
  ['Usme','T2','Hospital de Usme','S',88,'Ventas informales','16 oct 2026, 10:00'],
  ['Tunjuelito','T1','Plazoleta Codensa','V',null,'Sin dato','—'],
  ['Bosa','T1','Bosa Libertad','S',82,'Retorno de ventas informales','16 oct 2026, 08:20'],
  ['Bosa','T2','Calle 50 Sur','V',null,'Sin dato','—'],
  ['Bosa','T2','Islandia','S',90,'Ventas informales','16 oct 2026, 10:00'],
  ['Kennedy','T1','Carrera 93D con Calle 6 Bis A','A',72,'Retorno de ventas informales','13 oct 2026, 09:15'],
  ['Kennedy','T2','Carrera 82A # 68-11','N',44,'Retorno de ventas informales','18 oct 2026, 10:40'],
  ['Kennedy','T2','Carrera 81C con Calles 46 y 47 Sur','V',null,'Sin dato','—'],
  ['Kennedy','T2','Carrera 83 con Calle 46 Sur','S',86,'Ventas informales','16 oct 2026, 10:00'],
  ['Fontibón','T1','Parque fundacional','A',66,'Retorno de ventas informales','17 oct 2026, 09:30'],
  ['Fontibón','T2','Plaza de mercado','N',58,'Ventas informales','16 oct 2026, 10:00'],
  ['Engativá','T1','Carrera 68 # 52-25','V',null,'Sin dato','—'],
  ['Engativá','T2','Supermanzana — Diagonal 44 entre Calle 26 y Carrera 69','S',81,'Retorno de ventas informales','17 oct 2026, 13:40'],
  ['Suba','T1','Carrera 104A con Calle 152A','A',78,'Falta de apropiación comunitaria','18 oct 2026, 08:50'],
  ['Suba','T2','Calle 124 con Carrera 45 — puente peatonal','V',null,'Sin dato','—'],
  ['Barrios Unidos','T1','Cafam de La Floresta','S',92,'Retorno de ventas informales','13 oct 2026, 11:30'],
  ['Barrios Unidos','T2','El Lugar de Su Presencia','A',70,'Ventas informales','16 oct 2026, 10:00'],
  ['Teusaquillo','T1','Clínica Colombia','N',62,'Parqueo indebido','13 oct 2026, 17:10'],
  ['Teusaquillo','T2','Salitre oriental — Calle 24A desde la 60 hasta la 51','V',null,'Sin dato','—'],
  ['Los Mártires','T1','Voto Nacional','S',83,'Reaparición de cambuches','19 oct 2026, 11:00'],
  ['Los Mártires','T2','Plaza España','A',74,'Ventas informales','16 oct 2026, 10:00'],
  ['Antonio Nariño','T1','Calle 19 Sur desde Carrera 16 hasta Carrera 19','N',51,'Retorno de ventas informales','19 oct 2026, 13:25'],
  ['Antonio Nariño','T2','Rotonda de la Avenida Carrera 50','V',null,'Sin dato','—'],
  ['Puente Aranda','T1','Carrera 62 desde Calle 9 hasta Calle 10','S',87,'Parqueo indebido','16 oct 2026, 14:05'],
  ['Puente Aranda','T2','Outlet de Las Américas','A',68,'Retorno de ventas informales','16 oct 2026, 16:30'],
  ['La Candelaria','T1','Carrera 10 con Calle 13','N',46,'Retorno de ventas informales','20 oct 2026, 11:20'],
  ['La Candelaria','T2','Corredor Carrera Séptima','V',null,'Sin dato','—'],
  ['Rafael Uribe Uribe','T1','Lomas — Calle 40 Sur con Carrera 10','S',85,'Retorno de ventas informales','20 oct 2026, 12:35'],
  ['Rafael Uribe Uribe','T2','Olaya — Centro Médico Virrey Solís','A',76,'Ventas informales','16 oct 2026, 10:00'],
  ['Ciudad Bolívar','T1','Transversal 70D Bis # 68-75 Sur — El Peñón / El Cortijo','N',38,'Ventas informales','16 oct 2026, 10:00'],
  ['Ciudad Bolívar','T2','Ensueño — Ismael Perdomo','V',null,'Sin dato','—']
];

const COORDS_P04: [number, number][] = [[4.737177,-74.027205],[4.740809,-74.031993],[4.766662,-74.024117],[4.681839,-74.047834],[4.665039,-74.06066],[4.628754,-74.068282],[4.58843,-74.077783],[4.603795,-74.080042],[4.5325,-74.088267],[4.546325,-74.083544],[4.555483,-74.099961],[4.513153,-74.116676],[4.511839,-74.117198],[4.515882,-74.121253],[4.537715,-74.115682],[4.566879,-74.132165],[4.566194,-74.134361],[4.612662,-74.194884],[4.634412,-74.18144],[4.62601,-74.184428],[4.634349,-74.192416],[4.605213,-74.168535],[4.630525,-74.164035],[4.618246,-74.152498],[4.630494,-74.166921],[4.641094,-74.159962],[4.613753,-74.181308],[4.643065,-74.16426],[4.676585284029739,-74.14438003419538],[4.684998,-74.138345],[4.715568,-74.095311],[4.675654,-74.093038],[4.683527,-74.089527],[4.748795,-74.116806],[4.748426,-74.121108],[4.739533,-74.091896],[4.726418,-74.08912],[4.676725,-74.081025],[4.654302,-74.06927],[4.672375,-74.074789],[4.645611,-74.065477],[4.633201,-74.087266],[4.601051,-74.083801],[4.618095,-74.084239],[4.600064,-74.090144],[4.591437,-74.100966],[4.591993,-74.104679],[4.609217,-74.091493],[4.607644,-74.107241],[4.600252,-74.11732],[4.598516,-74.118676],[4.590024,-74.073803],[4.593697,-74.069136],[4.563731,-74.108254],[4.546923,-74.109098],[4.544595,-74.135994],[4.576362,-74.155328],[4.558291,-74.135332],[4.234533,-74.188839],[4.204371,-74.189922]];
const COORDS_P05: [number, number][] = [[4.719023,-74.035328],[4.694934,-74.03145],[4.704535,-74.049086],[4.6906,-74.045932],[4.726831,-74.045871],[4.657463,-74.062087],[4.644899,-74.065521],[4.60142,-74.07342],[4.602118,-74.072969],[4.57099,-74.096429],[4.568966,-74.097673],[4.569003,-74.095291],[4.570149,-74.093553],[4.470645,-74.123457],[4.530913,-74.118314],[4.489496,-74.109753],[4.5942973,-74.1421347],[4.626976,-74.191943],[4.631115,-74.180176],[4.613418,-74.198511],[4.650967,-74.162793],[4.647131,-74.146788],[4.623066,-74.170252],[4.626052,-74.172455],[4.673586,-74.144934],[4.676583,-74.144336],[4.663283,-74.096994],[4.661755,-74.108114],[4.752439,-74.09332],[4.705043,-74.054501],[4.687255,-74.074634],[4.684883,-74.062597],[4.648563,-74.107046],[4.646576,-74.102371],[4.601931,-74.082168],[4.605438,-74.085484],[4.583507,-74.102439],[4.592019,-74.127058],[4.628816,-74.116947],[4.628981,-74.11503],[4.602149,-74.076894],[4.601357,-74.073486],[4.563561,-74.10823],[4.583534,-74.106095],[4.586115,-74.161038],[4.58283,-74.157982]];

export function buildDefaultSnapshotData(): SostenibilidadDatos {
  const puntosP04: PuntoRaw[] = RAW_P04.map((r, i) => ({
    id: `04-${i}`,
    ld: r[0],
    t: r[1],
    d: r[2],
    cls: r[3],
    prod: 'P04',
    isp: r[4],
    riesgo: r[5],
    fecha: r[6],
    lat: COORDS_P04[i]?.[0],
    lng: COORDS_P04[i]?.[1],
  }));

  const puntosP05: PuntoRaw[] = RAW_P05.map((r, i) => ({
    id: `05-${i}`,
    ld: r[0],
    t: r[1],
    d: r[2],
    cls: r[3],
    prod: 'P05',
    isp: r[4],
    riesgo: r[5],
    fecha: r[6],
    lat: COORDS_P05[i]?.[0],
    lng: COORDS_P05[i]?.[1],
  }));

  return {
    periodoVisita: '09–20 oct 2026',
    totalRespuestas: 104,
    totalPriorizadosP04: puntosP04.length,
    totalPriorizadosP05: puntosP05.length,
    puntosP04,
    puntosP05,
    criteriosP04: [
      { label: 'Pintura y embellecimiento', n: 21, ok: 35, color: '#16A34A' },
      { label: 'Siembra y jardinería', n: 15, ok: 25, color: '#16A34A' },
      { label: 'Murales artísticos', n: 13, ok: 22, color: '#16A34A' },
      { label: 'Señalización pedagógica', n: 12, ok: 20, color: '#16A34A' },
      { label: 'Cuidado vecinal', n: 12, ok: 20, color: '#16A34A' },
      { label: 'Jornadas comunitarias', n: 9, ok: 15, color: '#9A3412' },
      { label: 'Otras acciones comunitarias', n: 7, ok: 12, color: '#9A3412' },
      { label: 'Actividades pedagógicas', n: 5, ok: 8, color: '#9A3412' },
    ],
    criteriosP05: [
      { label: 'Espacio libre de ocupación (Total + Parcial)', ok: 64, color: '#16A34A' },
      { label: 'Condiciones físicas adecuadas (Total + Parcial)', ok: 64, color: '#16A34A' },
      { label: 'Apropiación ciudadana del espacio (Total + Parcial)', ok: 61, color: '#16A34A' },
    ],
    vocacionP05: [
      { label: 'Puntos de Ventas Informales', icon: 'ventas', total: 40, sost: 30, s: 22, a: 8, n: 10, pct: 75 },
      { label: 'Puntos de Parqueo Indebido', icon: 'parqueo', total: 4, sost: 2, s: 2, a: 0, n: 2, pct: 50 },
    ],
    condicionesP05: [
      { label: 'Espacio libre de ocupación', totalPct: 39, parcialPct: 25, noPct: 36, avancePct: 64, avanceN: 28, totalN: 44 },
      { label: 'Condiciones físicas adecuadas', totalPct: 41, parcialPct: 23, noPct: 36, avancePct: 64, avanceN: 28, totalN: 44 },
      { label: 'Apropiación del espacio recuperado', totalPct: 41, parcialPct: 20, noPct: 39, avancePct: 61, avanceN: 27, totalN: 44 },
    ],
    riesgosP04: [
      { label: 'Reincidencia de arrojo', n: 29, w: 100 },
      { label: 'Falta de cultura ciudadana', n: 10, w: 34 },
      { label: 'Habitabilidad en calle', n: 5, w: 17 },
      { label: 'Ausencia de control', n: 4, w: 14 },
      { label: 'Falta de recolección oportuna', n: 2, w: 7 },
      { label: 'Falta de apropiación', n: 2, w: 7 },
      { label: 'Comercio informal', n: 1, w: 3 }
    ],
    riesgosP05: [
      { label: 'Ventas informales', n: 40, w: 100 },
      { label: 'Parqueo indebido', n: 4, w: 10 },
    ],
    apropiacionP04: [
      { label: 'Apropiación comunitaria', pct: 28, color: '#E3002B' },
      { label: 'Mobiliario táctico', pct: 23, color: '#E3002B' },
      { label: 'Nudges instalados', pct: 32, color: '#E3002B' },
      { label: 'Conservación buena', pct: 42, color: '#9A3412' }
    ],
    apropiacionP05: [
      { label: 'Sensibilización y diálogo', pct: 68, n: 30, color: '#16A34A' },
      { label: 'Operativos IVC', pct: 61, n: 27, color: '#16A34A' },
      { label: 'Seguimiento semanal', pct: 41, n: 18, color: '#9A3412' },
      { label: 'Control parqueo y limpieza', pct: 32, n: 14, color: '#9A3412' }
    ],
    notaTablaP04: '',
    notaTablaP05: '',
    cobertura: [
      { label: 'Condición física del punto', pct: 100, color: '#16A34A' },
      { label: 'Uso adecuado del espacio recuperado', pct: 100, color: '#16A34A' },
      { label: 'Corresponsabilidad ciudadana', pct: 75, color: '#16A34A' },
      { label: 'Percepción general de la comunidad', pct: 72, color: '#16A34A' },
      { label: 'Reconocimiento de la intervención', pct: 57, color: '#9A3412' },
      { label: 'Acciones de gestión y control en espacio público', pct: 100, color: '#16A34A' }
    ],
    reglas: [
      { titulo: 'Sostenido suma dos clases', texto: 'Los clasificados Sostenido y los clasificados En riesgo cuentan como sostenidos. No sostenidos son únicamente los clasificados Recaída confirmada.' },
      { titulo: 'El formulario tiene cuatro opciones', texto: 'Sostenido, En riesgo, Recaída confirmada y Recién intervenido. La cuarta no registra casos en el periodo; cuando aparezca no clasifica como sostenida ni como no sostenida, porque es demasiado pronto para juzgarla.' },
      { titulo: 'Un punto, su visita más reciente', texto: 'El estado del punto es el de su última verificación.' },
      { titulo: 'Los productos no se consolidan', texto: 'P04 y P05 se calculan y se reportan por separado. No existe un porcentaje de sostenimiento de la iniciativa.' },
      { titulo: 'Sin verificación no clasifica', texto: 'Un punto sin visita no entra al porcentaje, pero sí al universo. Por eso tiene su propio bloque al cierre de cada producto.' }
    ],
    conciliado: []
  };
}

const DEFAULT_PORTAL_URL = 'https://mapas.gobiernobogota.gov.co/waportal/sharing/rest';
const DEFAULT_SURVEY_LAYER_URL = 'https://mapas.gobiernobogota.gov.co/waserver/rest/services/Hosted/survey123_6ad0fc8ddc574571bcb6252a49ebab4d_results/FeatureServer';

// Mapeo exacto 1-a-1 de cada fila de RAW_P04 (0..59) a su objectid en la capa de encuesta (1..61, omitiendo el OID 34 eliminado)
const P04_OID_BY_INDEX: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 0, 30, // 0 = Calle 20 con cra 103 (punto nuevo sin reporte en terreno, pendiente/en gris)
  31, 32, 33,
  // 34 (Parque Calle 91 # 130A) eliminado del listado oficial; continúa con Parque Bilbao (35)
  35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
  51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61
];

// Mapeo exacto 1-a-1 de cada fila de RAW_P05 (0..45) a su objectid en la capa Puntos_Priorizados (62..109, sin el duplicado 79)
const P05_OID_BY_INDEX: number[] = [
  62, 63, 64, 65, 66, // Usaquén (5)
  67, 68,             // Chapinero (2)
  69, 70,             // Santa Fe (2)
  72, 73, 74, 71,     // San Cristóbal (4)
  75, 76, 77,         // Usme (3)
  78,                 // Tunjuelito (1 - Plazoleta Codensa)
  80, 81, 82,         // Bosa (3)
  83, 84, 85, 86,     // Kennedy (4)
  87, 88,             // Fontibón (2)
  89, 90,             // Engativá (2)
  91, 93,             // Suba (2)
  94, 95,             // Barrios Unidos (2)
  96, 97,             // Teusaquillo (2)
  98, 99,             // Los Mártires (2)
  106, 107,           // Antonio Nariño (2)
  100, 101,           // Puente Aranda (2)
  102, 103,           // La Candelaria (2)
  104, 105,           // Rafael Uribe Uribe (2)
  108, 109            // Ciudad Bolívar (2)
];

// Enlace de los primeros reportes de Usaquén y Fontibón que usaron el ID de la capa histórica
const LEGACY_PUNTO_MAP: Record<number, number> = {
  2800: 1,   // Usaquén · Calle 161 con Carrera 8
  926: 2,    // Usaquén · Calle 163A con Carrera 9
  2099: 62,  // Usaquén · Calle 140 con Carrera 11
  1085: 65,  // Usaquén · Calle 106 con Carrera 15
  1771: 66,  // Usaquén · Carrera 19 con Calles 145 a 152
  1262: 30,  // Fontibón · Av. Calle 24 con Carrera 104
  2203: 87,  // Fontibón · Parque fundacional
  2252: 88   // Fontibón · Plaza de mercado
};

const RIESGO_LABELS: Record<string, string> = {
  reincidencia_de_arrojo: 'Reincidencia de arrojo',
  habitabilidad_en_calle: 'Habitabilidad en calle',
  falta_cultura_ciudadana: 'Falta de cultura ciudadana',
  falta_de_apropiacion: 'Falta de apropiación comunitaria',
  ausencia_de_control: 'Ausencia de control',
  comercio_informal: 'Comercio informal',
  falta_recoleccion_oportuna: 'Falta de recolección oportuna',
  ventas_informales: 'Retorno de ventas informales',
  parqueo_indebido: 'Parqueo indebido',
  falta_control: 'Falta de control',
  residuos: 'Arrojo de residuos',
  cambuches: 'Reaparición de cambuches',
  other: 'Otro factor de riesgo'
};

function formatEpochDate(ms?: number | null): string {
  if (!ms) return '—';
  try {
    const d = new Date(ms);
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    // Ajuste a hora Colombia (UTC-5)
    const col = new Date(d.getTime() - 5 * 3600 * 1000);
    const day = String(col.getUTCDate()).padStart(2, '0');
    const mon = months[col.getUTCMonth()];
    const yr = col.getUTCFullYear();
    const hh = String(col.getUTCHours()).padStart(2, '0');
    const mm = String(col.getUTCMinutes()).padStart(2, '0');
    return `${day} ${mon} ${yr}, ${hh}:${mm}`;
  } catch {
    return '—';
  }
}

function isSi(val: any): boolean {
  const s = String(val || '').trim().toLowerCase();
  return s === 'si' || s === 'sí' || s === 'yes';
}

function isNo(val: any): boolean {
  const s = String(val || '').trim().toLowerCase();
  return s === 'no';
}

/**
 * Cálculo del Índice de Sostenibilidad del Punto (ISP):
 * - 70% Calificación en territorio - Equipo Espacio Público SGL:
 *     Sostenido = 100 puntos (aporta 70 pts al ISP)
 *     En riesgo = 70 puntos (aporta 49 pts al ISP)
 *     Recaída confirmada = 30 puntos (aporta 21 pts al ISP)
 * - 30% Criterios físicos observables:
 *     P04 (Residuos · 5 criterios · 6 pts c/u = 30 pts):
 *       1. Libre de residuos acumulados
 *       2. Sin nuevo arrojo de residuos
 *       3. Sin disposición de RCD
 *       4. Sin reguero ni dispersión
 *       5. Limpieza aceptable
 *     P05 (Espacio Público · 6 criterios · 5 pts c/u = 30 pts):
 *       1. Punto libre de ocupación
 *       2. Espacio recuperado en condiciones adecuadas
 *       3. Apropiación del espacio recuperado
 *       4. Sin presencia de ventas informales
 *       5. Sin parqueo indebido
 *       6. Sin cambuches ni ocupaciones
 */
function buildCriteriosAndIsp(attr: any, prod: 'P04' | 'P05', cls: 'S' | 'A' | 'N' | 'RI' | 'V', fallbackIsp: number | null) {
  // Puntajes cerrados según mandato metodológico
  const baseTerritorio = cls === 'S' ? 100 : cls === 'A' ? 70 : cls === 'N' ? 30 : (cls === 'RI' ? 50 : (fallbackIsp ?? 70));

  if (prod === 'P04') {
    const c1 = isNo(attr.residuos_acumulados);
    const c2 = isNo(attr.arrojo_de_residuos);
    const c3 = isNo(attr.disposicion_rcd);
    const c4 = isNo(attr.reguero);
    const c5 = isSi(attr.limpieza_aceptable);
    const criteriosDetalle = [
      { k: 'Libre de residuos acumulados', v: c1 ? 'Sí' : 'No', ok: c1 },
      { k: 'Sin nuevo arrojo de residuos', v: c2 ? 'Sí' : 'No', ok: c2 },
      { k: 'Sin disposición de RCD', v: c3 ? 'Sí' : 'No', ok: c3 },
      { k: 'Sin reguero ni dispersión', v: c4 ? 'Sí' : 'No', ok: c4 },
      { k: 'Limpieza aceptable', v: c5 ? 'Sí' : (String(attr.limpieza_aceptable || '') === 'Parcialmente' ? 'Parcial' : 'No'), ok: c5 }
    ];
    const okCount = criteriosDetalle.filter(c => c.ok).length;
    // 70% Calificación territorio + 30% Criterios físicos (6 pts por criterio)
    const isp = Math.round(baseTerritorio * 0.7 + (okCount / 5) * 30);
    return { criteriosDetalle, isp };
  } else {
    const c1 = isSi(attr.punto_libre_ocupacion);
    const c2 = isSi(attr.ep_recuperado_cond_adecuadas);
    const c3 = isSi(attr.apropiacion);
    const c4 = isNo(attr.presencia_ventas);
    const c5 = isNo(attr.parqueo_indebido);
    const c6 = isNo(attr.cambuches_ocupaciones);
    const criteriosDetalle = [
      { k: 'Punto libre de ocupación', v: c1 ? 'Sí' : 'No', ok: c1 },
      { k: 'Espacio recuperado en condiciones adecuadas', v: c2 ? 'Sí' : 'No', ok: c2 },
      { k: 'Apropiación del espacio recuperado', v: c3 ? 'Sí' : 'No', ok: c3 },
      { k: 'Sin presencia de ventas informales', v: c4 ? 'Sí' : 'No', ok: c4 },
      { k: 'Sin parqueo indebido', v: c5 ? 'Sí' : 'No', ok: c5 },
      { k: 'Sin cambuches ni ocupaciones', v: c6 ? 'Sí' : 'No', ok: c6 }
    ];
    const okCount = criteriosDetalle.filter(c => c.ok).length;
    // 70% Calificación territorio + 30% Criterios físicos (5 pts por criterio)
    const isp = Math.round(baseTerritorio * 0.7 + (okCount / 6) * 30);
    return { criteriosDetalle, isp };
  }
}

// Caché de token en memoria para evitar rate-limits de ArcGIS
let cachedArcgisToken: { token: string; expiresAt: number } | null = null;

async function getArcGISToken(overrideUser?: string, overridePass?: string, overrideToken?: string): Promise<{ token: string | null; error?: string }> {
  if (overrideToken && overrideToken.trim()) {
    let rawTok = overrideToken.trim();
    if (rawTok.startsWith('{')) {
      try {
        const parsed = JSON.parse(rawTok);
        const firstPortal = Object.values(parsed)[0] as any;
        if (parsed.token) rawTok = parsed.token;
        else if (firstPortal?.token) rawTok = firstPortal.token;
      } catch {
        // continuar con el string
      }
    }
    cachedArcgisToken = { token: rawTok, expiresAt: Date.now() + 45 * 60 * 1000 };
    return { token: rawTok };
  }
  if (process.env.ARCGIS_TOKEN && process.env.ARCGIS_TOKEN.trim()) {
    return { token: process.env.ARCGIS_TOKEN.trim() };
  }
  if (cachedArcgisToken && cachedArcgisToken.expiresAt > Date.now() && !overrideUser && !overridePass) {
    return { token: cachedArcgisToken.token };
  }

  const portalUrl = (process.env.ARCGIS_PORTAL_URL || DEFAULT_PORTAL_URL).replace(/\/$/, '');
  const username = (overrideUser || process.env.ARCGIS_USERNAME || 'profesionalOEP').trim();
  const password = (overridePass || process.env.ARCGIS_PASSWORD || '8beIjZucld').trim();
  if (!username || !password) {
    return { token: null, error: 'Credenciales ARCGIS_USERNAME / ARCGIS_PASSWORD no configuradas.' };
  }

  try {
    const params = new URLSearchParams({
      username,
      password,
      client: 'referer',
      referer: 'https://survey123.arcgis.com',
      f: 'json',
      expiration: '60'
    });
    const res = await fetch(`${portalUrl}/generateToken`, {
      method: 'POST',
      body: params
    });
    const data: any = await res.json();
    if (data.token) {
      cachedArcgisToken = {
        token: data.token,
        expiresAt: data.expires ? data.expires - 60000 : Date.now() + 50 * 60 * 1000
      };
      return { token: data.token };
    }
    const detail = Array.isArray(data.error?.details) ? data.error.details.join(' ') : '';
    return { token: null, error: `${data.error?.message || 'Error de autenticación ArcGIS'} ${detail}`.trim() };
  } catch (err: any) {
    return { token: null, error: err.message || 'Error de red conectando al portal ArcGIS' };
  }
}

async function syncFromArcGIS(
  baseDatos: SostenibilidadDatos,
  options?: { username?: string; password?: string; token?: string }
): Promise<{ datos: SostenibilidadDatos; connected: boolean; message: string; totalRespuestas: number }> {
  const auth = await getArcGISToken(options?.username, options?.password, options?.token);

  if (!auth.token) {
    return {
      datos: baseDatos,
      connected: false,
      message: `Copia en línea verificada y conservada. (Aviso ArcGIS: ${auth.error})`,
      totalRespuestas: baseDatos.totalRespuestas
    };
  }

  const token = auth.token;
  try {
    const surveyServiceUrl = (process.env.ARCGIS_SURVEY_LAYER_URL || DEFAULT_SURVEY_LAYER_URL).replace(/\/$/, '');
    const resultsLayerUrl = `${surveyServiceUrl}/0`;

    // 1. Consultar todas las respuestas y todos los adjuntos (fotos y videos) en paralelo
    const [qRes, aRes] = await Promise.all([
      fetch(`${resultsLayerUrl}/query?where=1%3D1&outFields=*&returnGeometry=false&f=json&token=${token}`),
      fetch(`${resultsLayerUrl}/queryAttachments?definitionExpression=1%3D1&f=json&token=${token}`)
    ]);

    const qData: any = await qRes.json();
    const aData: any = await aRes.json();
    const features: any[] = qData?.features || [];

    // 2. Construir mapa de adjuntos por parentObjectId
    const attachMap: Record<number, { label: string; file: string; url: string; contentType: string }[]> = {};
    let totalMediaSynced = 0;

    for (const group of aData?.attachmentGroups || []) {
      const pid = group.parentObjectId;
      const infos: any[] = group.attachmentInfos || [];
      attachMap[pid] = infos.map((inf: any) => {
        const kw = String(inf.keywords || '').toLowerCase();
        let label = 'Evidencia de visita';
        if (kw.includes('fotografia2')) label = 'Fotografía 2 del estado actual';
        else if (kw.includes('fotografia')) label = 'Fotografía del estado actual';
        else if (kw.includes('video')) label = 'Video corto del punto';
        else if (inf.name) label = inf.name;

        const attId = inf.id ?? inf.attachmentid;
        const ct = inf.contentType || inf.content_type || 'image/jpeg';
        totalMediaSynced++;
        return {
          label,
          file: inf.name || inf.att_name || `adjunto_${attId}`,
          contentType: ct,
          url: `${resultsLayerUrl}/${pid}/attachments/${attId}`
        };
      });
    }

    // 3. Agrupar respuestas por objectid del punto priorizado (aplicando LEGACY_PUNTO_MAP, homologaciones y quedándonos con la visita más reciente)
    const byPuntoOid: Record<number, { attr: any; evidencias: { label: string; file: string; url: string; contentType: string }[] }[]> = {};
    for (const feat of features) {
      const attr = feat.attributes || {};
      const oid = Number(attr.objectid || attr.OBJECTID);
      let rawPunto = Number(attr.punto);

      // Regla de Homologación 1: Plazoleta Codensa
      // Si el reporte registra como "Autopista Sur #54 A - 07 reemplazo" o menciona Codensa / Autopista Sur 54:
      const fullText = (JSON.stringify(attr) + ' ' + String(attr.descripcion_de_lo_observado || '') + ' ' + String(attr.direccion_del_punto || '')).toLowerCase();
      if (
        fullText.includes('autopista sur #54') ||
        fullText.includes('54 a - 07') ||
        (fullText.includes('reemplazo') && (fullText.includes('codensa') || fullText.includes('autopista'))) ||
        (fullText.includes('codensa') && fullText.includes('tunjuelito'))
      ) {
        rawPunto = 78; // OID de Plazoleta Codensa en P05
      }

      if (!rawPunto) continue;
      const puntoOid = LEGACY_PUNTO_MAP[rawPunto] || rawPunto;
      if (!byPuntoOid[puntoOid]) byPuntoOid[puntoOid] = [];
      byPuntoOid[puntoOid].push({
        attr,
        evidencias: attachMap[oid] || []
      });
    }

    // Regla de Homologación 2: Carrera 91 # 130A (Suba · P04 · OID 38)
    // En el survey quedó registrada erróneamente como Calle 91 # 130A (punto 34).
    // Si punto 38 no tiene verificación directa pero punto 34 sí la tiene, homologar la verificación:
    if ((!byPuntoOid[38] || byPuntoOid[38].length === 0) && byPuntoOid[34] && byPuntoOid[34].length > 0) {
      byPuntoOid[38] = byPuntoOid[34];
    }

    for (const k of Object.keys(byPuntoOid)) {
      const numK = Number(k);
      byPuntoOid[numK].sort(
        (x, y) => (Number(y.attr.fecha_y_hora || y.attr.created_date || 0)) - (Number(x.attr.fecha_y_hora || x.attr.created_date || 0))
      );
    }

    const updatedDatos: SostenibilidadDatos = JSON.parse(JSON.stringify(baseDatos));
    if (features.length > 0) {
      updatedDatos.totalRespuestas = features.length;

      // Sincronizar los 60 puntos de P04 (objectid según P04_OID_BY_INDEX)
      updatedDatos.puntosP04 = updatedDatos.puntosP04.map((p, idx) => {
        const puntoOid = P04_OID_BY_INDEX[idx] ?? (idx + 1);
        const latest = byPuntoOid[puntoOid]?.[0];
        if (!latest) {
          return {
            ...p,
            cls: 'V',
            isp: null,
            riesgo: 'Sin dato',
            fecha: '—',
            evidencias: []
          };
        }
        const attr = latest.attr;
        const estadoRaw = String(attr.estado_de_sostenibilidad || '').toLowerCase();
        let cls: 'S' | 'A' | 'N' | 'RI' | 'V' = p.cls === 'V' ? 'S' : p.cls;
        if (estadoRaw.includes('riesgo')) cls = 'A';
        else if (estadoRaw.includes('reca')) cls = 'N';
        else if (estadoRaw.includes('reci')) cls = 'RI';
        else if (estadoRaw.includes('sostenido')) cls = 'S';

        const riesgoKey = String(attr.factor_de_riesgo || '').trim();
        const riesgo = RIESGO_LABELS[riesgoKey] || (p.riesgo !== 'Sin dato' ? p.riesgo : 'Reincidencia de arrojo');
        const { criteriosDetalle, isp } = buildCriteriosAndIsp(attr, 'P04', cls, p.isp);

        return {
          ...p,
          cls,
          isp,
          riesgo,
          fecha: formatEpochDate(attr.fecha_y_hora || attr.created_date),
          reporta: attr.nombre_reporte ? String(attr.nombre_reporte).trim() : p.reporta,
          dependencia: attr.dependencia === 'ugrt' ? 'Unidad de Gestión y Transformación (UGRT)' : (attr.dependencia || 'Subsecretaría de Gestión Local — Equipo EP'),
          descripcion: attr.descripcion_de_lo_observado ? String(attr.descripcion_de_lo_observado).trim() : p.descripcion,
          recomendacion: attr.recomendacion_para_la_alcaldia ? String(attr.recomendacion_para_la_alcaldia).trim() : p.recomendacion,
          criteriosDetalle,
          evidencias: latest.evidencias
        };
      });

      // Sincronizar los 47 puntos de P05 (objectid según P05_OID_BY_INDEX)
      const p04LatestAttrs: any[] = [];
      updatedDatos.puntosP04.forEach((_, idx) => {
        const l = byPuntoOid[idx + 1]?.[0];
        if (l) p04LatestAttrs.push(l.attr);
      });

      const p05LatestEntries: { oid: number; cls: 'S' | 'A' | 'N' | 'RI' | 'V'; esParqueo: boolean; attr: any }[] = [];

      updatedDatos.puntosP05 = updatedDatos.puntosP05.map((p, idx) => {
        const puntoOid = P05_OID_BY_INDEX[idx];
        const esCodensa = puntoOid === 78 || p.d.toLowerCase().includes('codensa');
        const lat = esCodensa ? 4.5942973 : p.lat;
        const lng = esCodensa ? -74.1421347 : p.lng;
        const latest = puntoOid ? byPuntoOid[puntoOid]?.[0] : undefined;
        if (!latest) {
          return {
            ...p,
            lat,
            lng,
            cls: 'V',
            isp: null,
            riesgo: 'Sin dato',
            fecha: '—',
            evidencias: []
          };
        }
        const attr = latest.attr;
        const estadoRaw = String(attr.estado_de_sostenibilidad || '').toLowerCase();
        let cls: 'S' | 'A' | 'N' | 'RI' | 'V' = p.cls === 'V' ? 'S' : p.cls;
        if (estadoRaw.includes('riesgo')) cls = 'A';
        else if (estadoRaw.includes('reca')) cls = 'N';
        else if (estadoRaw.includes('reci')) cls = 'RI';
        else if (estadoRaw.includes('sostenido')) cls = 'S';

        // Asociar en P05 exclusivamente a las 2 vocaciones principales: Ventas informales vs Parqueo indebido
        const riesgoKey = String(attr.principal_riesgo_recaida || '').trim();
        const esParqueo = riesgoKey === 'parqueo_indebido' || puntoOid === 84 || puntoOid === 83 || puntoOid === 106 || p.riesgo.toLowerCase().includes('parqueo');
        const riesgo = esParqueo ? 'Parqueo indebido' : 'Retorno de ventas informales';
        const { criteriosDetalle, isp } = buildCriteriosAndIsp(attr, 'P05', cls, p.isp);

        p05LatestEntries.push({ oid: puntoOid, cls, esParqueo, attr });

        return {
          ...p,
          lat,
          lng,
          cls,
          isp,
          riesgo,
          fecha: formatEpochDate(attr.fecha_y_hora || attr.created_date),
          reporta: attr.nombre_reporte ? String(attr.nombre_reporte).trim() : p.reporta,
          dependencia: attr.dependencia === 'ugrt' ? 'Unidad de Gestión y Transformación (UGRT)' : (attr.dependencia || 'Subsecretaría de Gestión Local — Equipo EP'),
          descripcion: attr.descripcion_de_lo_observado ? String(attr.descripcion_de_lo_observado).trim() : p.descripcion,
          recomendacion: attr.recomendacion_para_la_alcaldia ? String(attr.recomendacion_para_la_alcaldia).trim() : p.recomendacion,
          criteriosDetalle,
          evidencias: latest.evidencias
        };
      });

      // Calcular Principales acciones de apropiación en P04 desde que_acciones_apropiacion
      if (p04LatestAttrs.length > 0) {
        const LABELS_ACC_P04: Record<string, string> = {
          pintura: 'Pintura y embellecimiento',
          siembra: 'Siembra y jardinería',
          murales: 'Murales artísticos',
          senalizacion: 'Señalización pedagógica',
          cuidado_vecinal: 'Cuidado vecinal',
          jornada_comunitaria: 'Jornadas comunitarias',
          other: 'Otras acciones comunitarias',
          actividad_pedagogica: 'Actividades pedagógicas',
        };
        const countsAcc: Record<string, number> = {};
        p04LatestAttrs.forEach(a => {
          const raw = String(a.que_acciones_apropiacion || '');
          raw.split(',').map(s => s.trim()).filter(Boolean).forEach(k => {
            countsAcc[k] = (countsAcc[k] || 0) + 1;
          });
        });
        const totalVerP04 = p04LatestAttrs.length || 1;
        const computedAccP04 = Object.entries(LABELS_ACC_P04)
          .map(([k, label]) => {
            const n = countsAcc[k] || 0;
            const ok = Math.round((n / totalVerP04) * 100);
            return { label, n, ok, color: ok >= 20 ? '#16A34A' : '#9A3412' };
          })
          .filter(x => x.n > 0)
          .sort((a, b) => b.n - a.n);
        if (computedAccP04.length > 0) {
          updatedDatos.criteriosP04 = computedAccP04;
        }
      }

      // Calcular Alternativa 2 para P05: Vocación (Ventas informales vs Parqueo indebido) + Condiciones (Total / Parcial / No) + Acciones desplegadas
      if (p05LatestEntries.length > 0) {
        const ventasGroup = p05LatestEntries.filter(e => !e.esParqueo);
        const parqueoGroup = p05LatestEntries.filter(e => e.esParqueo);

        const calcGroup = (label: string, icon: 'ventas' | 'parqueo', grp: typeof p05LatestEntries): VocacionP05Item => {
          const total = grp.length;
          const s = grp.filter(g => g.cls === 'S').length;
          const a = grp.filter(g => g.cls === 'A').length;
          const n = grp.filter(g => g.cls === 'N').length;
          const sost = s + a;
          const pct = total > 0 ? Math.round((sost / total) * 100) : 0;
          return { label, icon, total, sost, s, a, n, pct };
        };

        updatedDatos.vocacionP05 = [
          calcGroup('Puntos de Ventas Informales', 'ventas', ventasGroup),
          calcGroup('Puntos de Parqueo Indebido', 'parqueo', parqueoGroup),
        ];

        const maxRiesgo = Math.max(ventasGroup.length, parqueoGroup.length, 1);
        updatedDatos.riesgosP05 = [
          { label: 'Ventas informales', n: ventasGroup.length, w: Math.round((ventasGroup.length / maxRiesgo) * 100) },
          { label: 'Parqueo indebido', n: parqueoGroup.length, w: Math.round((parqueoGroup.length / maxRiesgo) * 100) },
        ];

        const calcCond = (label: string, field: string): CondicionP05Item => {
          const totalN = p05LatestEntries.length || 1;
          let si = 0;
          let parc = 0;
          let no = 0;
          p05LatestEntries.forEach(e => {
            const v = String(e.attr[field] || '').toLowerCase();
            if (v.startsWith('si') || v.startsWith('sí')) si++;
            else if (v.startsWith('parcial')) parc++;
            else no++;
          });
          const totalPct = Math.round((si / totalN) * 100);
          const parcialPct = Math.round((parc / totalN) * 100);
          const noPct = Math.max(0, 100 - totalPct - parcialPct);
          return {
            label,
            totalPct,
            parcialPct,
            noPct,
            avancePct: Math.round(((si + parc * 0.5) / totalN) * 100),
            avanceN: si + parc,
            totalN: p05LatestEntries.length,
          };
        };

        updatedDatos.condicionesP05 = [
          calcCond('Espacio libre de ocupación', 'punto_libre_ocupacion'),
          calcCond('Condiciones físicas adecuadas', 'ep_recuperado_cond_adecuadas'),
          calcCond('Apropiación del espacio recuperado', 'apropiacion'),
        ];

        // Acciones de gestión y control desplegadas en P05 (tipo_de_accion_recomendada)
        let cSens = 0;
        let cIvc = 0;
        let cSeg = 0;
        let cParqLimp = 0;
        p05LatestEntries.forEach(e => {
          const raw = String(e.attr.tipo_de_accion_recomendada || '').toLowerCase();
          if (raw.includes('sensibilizacion')) cSens++;
          if (raw.includes('ivc')) cIvc++;
          if (raw.includes('seguimiento_semanal')) cSeg++;
          if (raw.includes('control_de_parqueo') || raw.includes('limpieza') || raw.includes('apropiacion_comunitaria')) cParqLimp++;
        });
        const totP05 = p05LatestEntries.length || 1;
        updatedDatos.apropiacionP05 = [
          { label: 'Sensibilización y diálogo', pct: Math.round((cSens / totP05) * 100), n: cSens, color: '#16A34A' },
          { label: 'Operativos IVC', pct: Math.round((cIvc / totP05) * 100), n: cIvc, color: '#16A34A' },
          { label: 'Seguimiento semanal', pct: Math.round((cSeg / totP05) * 100), n: cSeg, color: '#9A3412' },
          { label: 'Control parqueo y limpieza', pct: Math.round((cParqLimp / totP05) * 100), n: cParqLimp, color: '#9A3412' },
        ];
      }
    }

    // 4. Sincronizar en vivo los registros del formulario «Operación Espacio Público» (P04 Gestión de residuos)
    let totalIntervencionesP04 = 1983;
    try {
      const opLayerName = encodeURIComponent('Operación_Espacio_Público_Vista');
      const opWhere = encodeURIComponent("componente_a_reportar LIKE '%residuos%'");
      const opCountUrl = `https://mapas.gobiernobogota.gov.co/waserver/rest/services/Hosted/${opLayerName}/FeatureServer/0/query?where=${opWhere}&returnCountOnly=true&f=json`;
      const opCountRes = await fetch(opCountUrl);
      if (opCountRes.ok) {
        const opCountJson: any = await opCountRes.json();
        if (typeof opCountJson?.count === 'number' && opCountJson.count > 0) {
          totalIntervencionesP04 = opCountJson.count;
          (updatedDatos as any).totalIntervencionesP04 = totalIntervencionesP04;
        }
      }
    } catch {
      // Conservar base de 1.983 si la consulta secundaria falla
    }

    return {
      datos: updatedDatos,
      connected: true,
      message: `Sincronizado en vivo con Survey123 (${updatedDatos.totalRespuestas} verificaciones de sostenibilidad, ${totalIntervencionesP04.toLocaleString('es-CO')} intervenciones P04 y ${totalMediaSynced} fotos/videos).`,
      totalRespuestas: updatedDatos.totalRespuestas
    };
  } catch (err: any) {
    return {
      datos: baseDatos,
      connected: false,
      message: `Copia en línea conservada. Error consultando servicio ArcGIS: ${err.message}`,
      totalRespuestas: baseDatos.totalRespuestas
    };
  }
}

async function ensureSnapshotExists() {
  let latest = await prisma.sostenibilidadSnapshot.findFirst({
    orderBy: { ultimaLectura: 'desc' }
  });
  if (!latest) {
    const initial = buildDefaultSnapshotData();
    const synced = await syncFromArcGIS(initial);
    latest = await prisma.sostenibilidadSnapshot.create({
      data: {
        ultimaLectura: new Date(),
        origen: synced.connected ? 'ARCGIS_INICIAL' : 'SEMILLA',
        ejecutadoPor: 'Sistema RADAR',
        surveyId: process.env.ARCGIS_SURVEY_ID || '6ad0fc8ddc574571bcb6252a49ebab4d',
        totalRespuestas: synced.totalRespuestas,
        totalPriorizados: synced.datos.totalPriorizadosP04 + synced.datos.totalPriorizadosP05,
        datosJson: synced.datos as any
      }
    });
  }
  return latest;
}

// GET /api/sostenibilidad — Devuelve la copia guardada en línea (Supabase PostgreSQL)
router.get('/', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const snapshot = await ensureSnapshotExists();
    res.json({
      id: snapshot.id,
      ultimaLectura: snapshot.ultimaLectura,
      origen: snapshot.origen,
      ejecutadoPor: snapshot.ejecutadoPor,
      surveyId: snapshot.surveyId,
      totalRespuestas: snapshot.totalRespuestas,
      totalPriorizados: snapshot.totalPriorizados,
      datos: snapshot.datosJson
    });
  } catch (error: any) {
    console.error('Error en GET /api/sostenibilidad:', error);
    const fallback = buildDefaultSnapshotData();
    res.json({
      id: 'fallback-local',
      ultimaLectura: new Date().toISOString(),
      origen: 'MEMORIA',
      ejecutadoPor: 'Sistema RADAR',
      surveyId: process.env.ARCGIS_SURVEY_ID || '6ad0fc8ddc574571bcb6252a49ebab4d',
      totalRespuestas: fallback.totalRespuestas,
      totalPriorizados: fallback.totalPriorizadosP04 + fallback.totalPriorizadosP05,
      datos: fallback
    });
  }
});

// POST /api/sostenibilidad/sync — Ejecuta actualización (por botón manual o auto-refresh) y guarda copia en línea
router.post('/sync', azureADAuth, async (req: AuthRequest, res) => {
  try {
    const baseDatos = buildDefaultSnapshotData();
    const { username, password, token, origen } = req.body || {};

    const syncResult = await syncFromArcGIS(baseDatos, { username, password, token });

    const saved = await prisma.sostenibilidadSnapshot.create({
      data: {
        ultimaLectura: new Date(),
        origen: origen === 'AUTOMATICO' ? 'AUTOMATICO' : 'MANUAL',
        ejecutadoPor: req.user?.nombre || req.user?.email || 'Usuario RADAR',
        surveyId: process.env.ARCGIS_SURVEY_ID || '6ad0fc8ddc574571bcb6252a49ebab4d',
        totalRespuestas: syncResult.totalRespuestas,
        totalPriorizados: syncResult.datos.totalPriorizadosP04 + syncResult.datos.totalPriorizadosP05,
        datosJson: syncResult.datos as any
      }
    });

    // Limpiar snapshots antiguos dejando los últimos 15 para historial limpio
    const oldSnapshots = await prisma.sostenibilidadSnapshot.findMany({
      orderBy: { ultimaLectura: 'desc' },
      skip: 15,
      select: { id: true }
    });
    if (oldSnapshots.length > 0) {
      await prisma.sostenibilidadSnapshot.deleteMany({
        where: { id: { in: oldSnapshots.map(s => s.id) } }
      });
    }

    res.json({
      id: saved.id,
      ultimaLectura: saved.ultimaLectura,
      origen: saved.origen,
      ejecutadoPor: saved.ejecutadoPor,
      surveyId: saved.surveyId,
      totalRespuestas: saved.totalRespuestas,
      totalPriorizados: saved.totalPriorizados,
      datos: saved.datosJson,
      arcgisConnected: syncResult.connected,
      message: syncResult.message
    });
  } catch (error: any) {
    console.error('Error en POST /api/sostenibilidad/sync:', error);
    res.status(500).json({ error: 'Error sincronizando tablero de sostenibilidad', details: error.message });
  }
});

// GET /api/sostenibilidad/attachment — Proxy seguro para visualizar fotos/videos de ArcGIS Survey123
router.get('/attachment', async (req, res) => {
  try {
    const rawUrl = String(req.query.url || '');
    if (!rawUrl || !rawUrl.startsWith('https://')) {
      return res.status(400).send('URL de adjunto inválida');
    }
    const auth = await getArcGISToken();
    const targetUrl = auth.token ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}token=${auth.token}` : rawUrl;
    const upstream = await fetch(targetUrl);
    if (!upstream.ok) {
      return res.status(upstream.status).send('No se pudo obtener el adjunto desde ArcGIS');
    }
    let contentType = upstream.headers.get('content-type') || 'image/jpeg';
    // Normalizar video/quicktime (.MOV H.264) a video/mp4 para reproducción nativa en navegadores Chromium
    if (contentType.includes('quicktime') || rawUrl.toLowerCase().endsWith('.mov')) {
      contentType = 'video/mp4';
    }
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.status(500).send('Error cargando adjunto');
  }
});

// GET /api/sostenibilidad/tile/:style/:z/:y/:x — Proxy de teselas de mapa base (IDECA Bogotá, ArcGIS Calles, Satélite, OSM)
router.get('/tile/:style/:z/:y/:x', async (req, res) => {
  try {
    const { style, z, y, x } = req.params;
    let targetUrl = '';
    if (style === 'ideca') {
      targetUrl = `https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/Mapa_Referencia/mapa_base_3857/MapServer/tile/${z}/${y}/${x}`;
    } else if (style === 'satelite') {
      targetUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    } else if (style === 'osm') {
      targetUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    } else {
      targetUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`;
    }

    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'RADAR-SecretariaGobiernoBogota/1.0',
      },
    });
    if (!upstream.ok) {
      return res.status(upstream.status).end();
    }
    const contentType = upstream.headers.get('content-type') || 'image/png';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch {
    res.status(502).end();
  }
});

export default router;

