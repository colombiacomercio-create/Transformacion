import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchApi } from '../../utils/api';
import { RefreshCw, Settings, ExternalLink, CheckCircle2, AlertCircle, Clock, X, Camera, Video, ZoomIn, MapPin, Calendar, Download, Printer, Loader2, FileText, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PUNTOS_FOCALIZADOS_OCT_2026, GESTION_P04_DEFAULT, PuntoFocalizadoOct } from './datosGestionP04';
import { BloquesGestionP04, ModalPuntoFocalizadoOct } from './BloquesGestionP04';

const API = import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app';
const SURVEY_SHARE_URL = 'https://survey123.arcgis.com/share/6ad0fc8ddc574571bcb6252a49ebab4d/result';

const COORDS_P04: [number, number][] = [[4.737177,-74.027205],[4.740809,-74.031993],[4.766662,-74.024117],[4.681839,-74.047834],[4.665039,-74.06066],[4.628754,-74.068282],[4.58843,-74.077783],[4.603795,-74.080042],[4.5325,-74.088267],[4.546325,-74.083544],[4.555483,-74.099961],[4.513153,-74.116676],[4.511839,-74.117198],[4.515882,-74.121253],[4.537715,-74.115682],[4.566879,-74.132165],[4.566194,-74.134361],[4.612662,-74.194884],[4.634412,-74.18144],[4.62601,-74.184428],[4.634349,-74.192416],[4.605213,-74.168535],[4.630525,-74.164035],[4.618246,-74.152498],[4.630494,-74.166921],[4.641094,-74.159962],[4.613753,-74.181308],[4.643065,-74.16426],[4.676585284029739,-74.14438003419538],[4.684998,-74.138345],[4.715568,-74.095311],[4.675654,-74.093038],[4.683527,-74.089527],[4.748795,-74.116806],[4.748426,-74.121108],[4.739533,-74.091896],[4.726418,-74.08912],[4.676725,-74.081025],[4.654302,-74.06927],[4.672375,-74.074789],[4.645611,-74.065477],[4.633201,-74.087266],[4.601051,-74.083801],[4.618095,-74.084239],[4.600064,-74.090144],[4.591437,-74.100966],[4.591993,-74.104679],[4.609217,-74.091493],[4.607644,-74.107241],[4.600252,-74.11732],[4.598516,-74.118676],[4.590024,-74.073803],[4.593697,-74.069136],[4.563731,-74.108254],[4.546923,-74.109098],[4.544595,-74.135994],[4.576362,-74.155328],[4.558291,-74.135332],[4.234533,-74.188839],[4.204371,-74.189922]];
const COORDS_P05: [number, number][] = [[4.719023,-74.035328],[4.694934,-74.03145],[4.704535,-74.049086],[4.6906,-74.045932],[4.726831,-74.045871],[4.657463,-74.062087],[4.644899,-74.065521],[4.60142,-74.07342],[4.602118,-74.072969],[4.57099,-74.096429],[4.568966,-74.097673],[4.569003,-74.095291],[4.570149,-74.093553],[4.470645,-74.123457],[4.530913,-74.118314],[4.489496,-74.109753],[4.5942973,-74.1421347],[4.626976,-74.191943],[4.631115,-74.180176],[4.613418,-74.198511],[4.650967,-74.162793],[4.647131,-74.146788],[4.623066,-74.170252],[4.626052,-74.172455],[4.673586,-74.144934],[4.676583,-74.144336],[4.663283,-74.096994],[4.661755,-74.108114],[4.752439,-74.09332],[4.705043,-74.054501],[4.687255,-74.074634],[4.684883,-74.062597],[4.648563,-74.107046],[4.646576,-74.102371],[4.601931,-74.082168],[4.605438,-74.085484],[4.583507,-74.102439],[4.592019,-74.127058],[4.628816,-74.116947],[4.628981,-74.11503],[4.602149,-74.076894],[4.601357,-74.073486],[4.563561,-74.10823],[4.583534,-74.106095],[4.586115,-74.161038],[4.58283,-74.157982]];

interface PuntoRaw {
  id: string;
  ld: string;
  t: 'T1' | 'T2';
  d: string;
  cls: 'S' | 'A' | 'N' | 'RI' | 'V';
  prod: 'P04' | 'P05';
  isp: number | null;
  riesgo: string;
  fecha: string;
  lat?: number;
  lng?: number;
  reporta?: string;
  dependencia?: string;
  descripcion?: string;
  recomendacion?: string;
  criteriosDetalle?: { k: string; v: string; ok: boolean }[];
  evidencias?: { label: string; file: string; url?: string; contentType?: string }[];
}

interface VocacionP05Item {
  key: 'ventas' | 'parqueo';
  label: string;
  sublabel: string;
  total: number;
  sostenidos: number;
  enRiesgo: number;
  recaida: number;
  pctSostenimiento: number;
  pctSostenimientoTxt?: string;
  color: string;
}

interface CondicionP05Item {
  label: string;
  total: number;
  parcial: number;
  no: number;
  pctTotal: number;
  pctParcial: number;
  pctNo: number;
  pctAvance: number;
}

interface SostenibilidadDatos {
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
  notaTablaP04?: string;
  notaTablaP05?: string;
  cobertura: { label: string; pct: number; color: string }[];
  reglas?: { titulo: string; texto: string }[];
  conciliado?: { tag: string; bg: string; fg: string; t: string }[];
  totalIntervencionesP04?: number;
}

interface SnapshotResponse {
  id: string;
  ultimaLectura: string;
  origen: string;
  ejecutadoPor?: string;
  surveyId?: string;
  totalRespuestas: number;
  totalPriorizados: number;
  datos: SostenibilidadDatos;
  arcgisConnected?: boolean;
  message?: string;
}

const CH: Record<string, { t: string; bg: string; fg: string; ink: string }> = {
  S:  { t: 'Sostenido',          bg: '#DCFCE7', fg: '#166534', ink: '#16A34A' },
  A:  { t: 'En riesgo',          bg: '#FFF7ED', fg: '#9A3412', ink: '#9A3412' },
  N:  { t: 'Recaída confirmada', bg: '#FEE2E2', fg: '#991B1B', ink: '#E3002B' },
  RI: { t: 'Recién intervenido', bg: '#F3F4F6', fg: '#4B5563', ink: '#6B7280' },
  V:  { t: 'Sin verificación',   bg: '#F3F4F6', fg: '#4B5563', ink: '#6B7280' },
};

const F04 = [
  'Libre de residuos acumulados',
  'Sin nuevo arrojo de residuos',
  'Sin disposición de RCD',
  'Sin reguero ni dispersión',
  'Limpieza aceptable',
];

const F05 = [
  'Punto libre de ocupación',
  'Espacio recuperado en condiciones adecuadas',
  'Apropiación del espacio recuperado',
  'Sin presencia de ventas informales',
  'Sin parqueo indebido',
  'Sin cambuches ni ocupaciones',
];

const DESC: Record<string, string> = {
  S: 'El punto se mantiene en las condiciones de la intervención. Las acciones instaladas están completas y en buen estado, y no se observan señales de recaída.',
  A: 'El punto conserva la recuperación, pero hay un criterio cediendo: lo instalado muestra desgaste y aparecen señales tempranas del factor de riesgo registrado.',
  N: 'Recaída confirmada: el punto volvió a la condición previa a la intervención. El factor de riesgo registrado está activo y lo instalado no alcanza a contenerlo.',
  RI: 'Punto recién intervenido en el periodo actual; en observación inicial.',
  V: 'Sin visita registrada en el periodo. No hay observación de territorio para este punto.',
};

const RECO: Record<string, string> = {
  S: 'Mantener la verificación del siguiente trimestre y documentar el caso para replicarlo en puntos con el mismo factor de riesgo.',
  A: 'Mantenimiento preventivo y refuerzo de lo instalado antes de la siguiente verificación. No requiere reintervención.',
  N: 'Reintervención dimensionada según el factor de riesgo y requerimiento a la Alcaldía Local con plazo. Es la única clase que exige volver a intervenir.',
  RI: 'Programar primera visita de seguimiento para evaluar sostenibilidad.',
  V: 'Programar la visita del trimestre. Antes de programar, conciliar contra la matriz para descartar que ya esté verificado bajo otra redacción de la dirección.',
};

const ACC: Record<string, string> = {
  S: 'Verificación trimestral',
  A: 'Mantenimiento preventivo',
  N: 'Reintervención',
  RI: 'Seguimiento inicial',
  V: 'Programar visita',
};

const REGLAS_OFICIALES = [
  {
    titulo: 'Sostenido suma dos clases',
    texto: 'Los clasificados Sostenido y En riesgo cuentan como sostenidos. No sostenidos son únicamente los clasificados Recaída confirmada.',
  },
  {
    titulo: 'Clasificaciones de verificación',
    texto: 'Sostenido, En riesgo, Recaída confirmada y Recién intervenido.',
  },
  {
    titulo: 'Un punto, su visita más reciente',
    texto: 'El estado del punto es el de su última verificación.',
  },
  {
    titulo: 'Lectura por producto',
    texto: 'P04 y P05 se calculan y se reportan por separado.',
  },
  {
    titulo: 'Sin verificación',
    texto: 'Un punto sin visita registrada no entra al cálculo del porcentaje de sostenimiento.',
  },
];

const CODS: [number, string][] = [
  [1, 'Usaquén'], [2, 'Chapinero'], [3, 'Santa Fe'], [4, 'San Cristóbal'],
  [5, 'Usme'], [6, 'Tunjuelito'], [7, 'Bosa'], [8, 'Kennedy'],
  [9, 'Fontibón'], [10, 'Engativá'], [11, 'Suba'], [12, 'Barrios Unidos'],
  [13, 'Teusaquillo'], [14, 'Los Mártires'], [15, 'Antonio Nariño'], [16, 'Puente Aranda'],
  [17, 'La Candelaria'], [18, 'Rafael Uribe Uribe'], [19, 'Ciudad Bolívar'], [20, 'Sumapaz'],
];

interface Props {
  userData?: any;
}

interface PuntoEnriquecido extends PuntoRaw {
  i: number;
  estado: string;
  chipBg: string;
  chipFg: string;
  ink: string;
  ispTxt: string;
  bg: string;
  lat?: number;
  lng?: number;
}

export type FiltroMapaProducto = 'TODOS' | 'P04' | 'P05' | 'OCT21';

interface MapaProps {
  puntos: PuntoEnriquecido[];
  puntosFocalizados: PuntoFocalizadoOct[];
  fechasDisponibles: { fecha: string; count: number }[];
  filtroFecha: string;
  onSelectFecha: (f: string) => void;
  mapaProducto: FiltroMapaProducto;
  onSelectProducto: (p: FiltroMapaProducto) => void;
  selectedId: string | null;
  onSelectPunto: (id: string) => void;
  selectedFocalizadoId: string | null;
  onSelectFocalizado: (id: string) => void;
}

type EstiloMapaBase = 'ideca' | 'calles' | 'osm' | 'satelite';

function obtenerUrlTile(estilo: EstiloMapaBase, useProxy = true): string {
  if (useProxy) {
    return `${API}/api/sostenibilidad/tile/${estilo}/{z}/{y}/{x}`;
  }
  if (estilo === 'ideca') {
    return 'https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/Mapa_Referencia/mapa_base_3857/MapServer/tile/{z}/{y}/{x}';
  }
  if (estilo === 'satelite') {
    return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  }
  if (estilo === 'osm') {
    return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  }
  return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
}

function MapaPuntosSostenibilidad({
  puntos,
  puntosFocalizados,
  fechasDisponibles,
  filtroFecha,
  onSelectFecha,
  mapaProducto,
  onSelectProducto,
  selectedId,
  onSelectPunto,
  selectedFocalizadoId,
  onSelectFocalizado,
}: MapaProps) {
  const [capaBase, setCapaBase] = useState<EstiloMapaBase>('ideca');
  const [mostrarLocalidades, setMostrarLocalidades] = useState<boolean>(true);
  const [mostrarFechasTab, setMostrarFechasTab] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const localidadesLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Inicializar mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [4.645, -74.095],
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    const crearTileLayer = (estilo: EstiloMapaBase) => {
      const layer = L.tileLayer(obtenerUrlTile(estilo, true), {
        attribution:
          estilo === 'ideca'
            ? '&copy; IDECA — Catastro Bogotá'
            : estilo === 'osm'
            ? '&copy; OpenStreetMap'
            : '&copy; Esri / ArcGIS',
        maxZoom: 19,
        crossOrigin: true,
      });

      // Si el proxy falla por cualquier motivo, usar URL directa del servicio oficial
      layer.on('tileerror', (err: any) => {
        const img = err?.tile as HTMLImageElement | undefined;
        const coords = err?.coords;
        if (img && coords && !img.dataset.fallbackTried) {
          img.dataset.fallbackTried = '1';
          const directTemplate = obtenerUrlTile(estilo, false);
          img.src = directTemplate
            .replace('{z}', String(coords.z))
            .replace('{y}', String(coords.y))
            .replace('{x}', String(coords.x));
        }
      });

      return layer;
    };

    const tile = crearTileLayer('ideca').addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tile;
    markersLayerRef.current = markersGroup;

    // Cargar polígonos vectoriales oficiales de las 20 Localidades de Bogotá (IDECA)
    fetch('/localidades_bogota.geojson')
      .then(r => (r.ok ? r.json() : null))
      .then(geo => {
        if (!geo || !mapInstanceRef.current) return;
        const geoLayer = L.geoJSON(geo, {
          style: () => ({
            color: '#475569',
            weight: 1.4,
            opacity: 0.65,
            fillColor: '#94A3B8',
            fillOpacity: 0.06,
            dashArray: '4, 3',
          }),
          onEachFeature: (feature, layer) => {
            const nombreLoc = feature?.properties?.LOCNOMBRE || '';
            if (nombreLoc) {
              layer.bindTooltip(
                `<span style="font-size:10.5px;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:.04em;">${nombreLoc}</span>`,
                { sticky: true, direction: 'center', opacity: 0.85 }
              );
            }
          },
        });
        localidadesLayerRef.current = geoLayer;
        geoLayer.addTo(mapInstanceRef.current);
        geoLayer.bringToBack();
      })
      .catch(() => {});

    const timer1 = setTimeout(() => map.invalidateSize(), 120);
    const timer2 = setTimeout(() => map.invalidateSize(), 450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      localidadesLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Mostrar / ocultar límites vectoriales de Localidades
  useEffect(() => {
    const map = mapInstanceRef.current;
    const geoLayer = localidadesLayerRef.current;
    if (!map || !geoLayer) return;
    if (mostrarLocalidades) {
      if (!map.hasLayer(geoLayer)) {
        geoLayer.addTo(map);
        geoLayer.bringToBack();
      }
    } else {
      if (map.hasLayer(geoLayer)) {
        map.removeLayer(geoLayer);
      }
    }
  }, [mostrarLocalidades]);

  // Cambiar capa base (IDECA Bogotá / Calles / OSM / Satélite) recreando el TileLayer limpiamente
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTile = L.tileLayer(obtenerUrlTile(capaBase, true), {
      attribution:
        capaBase === 'ideca'
          ? '&copy; IDECA — Catastro Bogotá'
          : capaBase === 'osm'
          ? '&copy; OpenStreetMap'
          : '&copy; Esri / ArcGIS',
      maxZoom: 19,
      crossOrigin: true,
    });

    newTile.on('tileerror', (err: any) => {
      const img = err?.tile as HTMLImageElement | undefined;
      const coords = err?.coords;
      if (img && coords && !img.dataset.fallbackTried) {
        img.dataset.fallbackTried = '1';
        const directTemplate = obtenerUrlTile(capaBase, false);
        img.src = directTemplate
          .replace('{z}', String(coords.z))
          .replace('{y}', String(coords.y))
          .replace('{x}', String(coords.x));
      }
    });

    newTile.addTo(map);
    newTile.bringToBack();
    tileLayerRef.current = newTile;
  }, [capaBase]);

  // Actualizar marcadores cuando cambian los puntos o filtros
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const coordsValidas: [number, number][] = [];

    // Separación visual inteligente para puntos geográficamente adyacentes o coincidentes
    // (ejemplo: P04 Residuos Calle 20 con cra 103 y P05 Espacio Público Plaza de Mercado en Fontibón)
    // Garantiza que ambos iconos se vean simultáneamente con su respectiva simbología y sean 100% clickeables
    // incluso a vista general de toda Bogotá (zoom 11) sin necesidad de hacer zoom.
    const puntosParaRender = puntos.map((p, idx) => {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number') {
        return { ...p, renderLat: p.lat, renderLng: p.lng, isShifted: false };
      }

      const tieneVecinoMuyCercano = puntos.some((otro, oIdx) => {
        if (oIdx === idx || typeof otro.lat !== 'number' || typeof otro.lng !== 'number') return false;
        const dLat = Math.abs(p.lat! - otro.lat);
        const dLng = Math.abs(p.lng! - otro.lng);
        return dLat < 0.0012 && dLng < 0.0012;
      });

      if (tieneVecinoMuyCercano) {
        // P04 se desplaza levemente al Nor-Oeste y P05 al Sur-Este
        const isP04 = p.prod === 'P04';
        const offLat = isP04 ? 0.0005 : -0.0005;
        const offLng = isP04 ? -0.0006 : 0.0006;
        return {
          ...p,
          renderLat: p.lat + offLat,
          renderLng: p.lng + offLng,
          isShifted: true
        };
      }
      return { ...p, renderLat: p.lat, renderLng: p.lng, isShifted: false };
    });

    puntosParaRender.forEach(p => {
      if (typeof p.renderLat !== 'number' || typeof p.renderLng !== 'number') return;
      if (isNaN(p.renderLat) || isNaN(p.renderLng)) return;

      // Excluir del auto-zoom de Bogotá urbana los 2 puntos rurales de Sumapaz para no alejar demasiado la vista inicial
      if (p.lat && p.lat > 4.4) {
        coordsValidas.push([p.renderLat, p.renderLng]);
      }

      const colorFill =
        p.cls === 'S'
          ? '#16A34A'
          : p.cls === 'A'
          ? '#F59E0B'
          : p.cls === 'N'
          ? '#E3002B'
          : '#6B7280';

      const isSelected = selectedId === p.id;
      const numFotos = p.evidencias?.length || 0;
      const size = isSelected ? 30 : 25;
      const svgSize = isSelected ? 16 : 14;

      // Icono P04: Caneca de residuos | Icono P05: Espacio público (Parque: Árbol + Banca + Farola)
      const iconSvg =
        p.prod === 'P04'
          ? `<svg viewBox="0 0 24 24" width="${svgSize}" height="${svgSize}" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>`
          : `<svg viewBox="0 0 24 24" width="${svgSize}" height="${svgSize}" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
              <path d="M2 21h20" />
              <path d="M6 13a3 3 0 1 0-1-5.8 3 3 0 0 0-2 2.8c0 1.7 1.3 3 3 3z" />
              <path d="M6 13v8" />
              <path d="M10 13h4v3h-4z" />
              <path d="M9 16h6" />
              <path d="M10 16v5" />
              <path d="M14 16v5" />
              <path d="M19 5a1.5 1.5 0 0 1 1.5 1.5L20 8h-2l-.5-1.5A1.5 1.5 0 0 1 19 5z" />
              <path d="M19 8v13" />
            </svg>`;

      const borderRadius = p.prod === 'P04' ? '9999px' : '7px';
      const borderStyle = isSelected ? '2.5px solid #111827' : '2px solid #FFFFFF';
      const shadowStyle = isSelected
        ? '0 0 0 3px rgba(17,24,39,0.35), 0 4px 10px rgba(0,0,0,0.4)'
        : '0 2px 5px rgba(0,0,0,0.32)';

      // Desplazamiento fijo en pantalla (píxeles constantes) para puntos vecinos
      // P04 queda 16px a la izquierda y P05 queda 16px a la derecha del ancla
      const isP04 = p.prod === 'P04';
      const anchorX = p.isShifted ? (isP04 ? size + 4 : -4) : size / 2;
      const anchorY = size / 2;

      const customIcon = L.divIcon({
        className: 'radar-sost-marker',
        iconSize: [size, size],
        iconAnchor: [anchorX, anchorY],
        html: `
          <div style="
            width:${size}px;
            height:${size}px;
            background:${colorFill};
            border:${borderStyle};
            border-radius:${borderRadius};
            box-shadow:${shadowStyle};
            display:flex;
            align-items:center;
            justify-content:center;
            cursor:pointer;
            transition:transform 0.12s ease;
          ">
            ${iconSvg}
          </div>
        `,
      });

      const marker = L.marker([p.renderLat, p.renderLng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : (p.prod === 'P04' ? 600 : 500) + (p.cls === 'N' ? 30 : p.cls === 'A' ? 20 : 10),
      });

      const tooltipHtml = `
        <div style="font-family:'Source Sans 3',system-ui,sans-serif;min-width:210px;max-width:280px;padding:2px 0;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px;">
            <span style="background:${p.prod === 'P04' ? '#E3002B' : '#1F2937'};color:#FFF;font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;">
              ${p.prod === 'P04' ? '🗑️ P04 Residuos' : '🌳 P05 Espacio público'} · ${p.t}
            </span>
            <span style="font-size:11px;font-weight:700;color:#374151;">${p.ld}</span>
          </div>
          <div style="font-size:12.5px;font-weight:700;color:#111827;line-height:1.25;margin-bottom:5px;white-space:normal;">
            #${p.i} · ${p.d}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px;">
            <span style="background:${p.chipBg};color:${p.chipFg};font-size:10.5px;font-weight:700;padding:2px 6px;border-radius:4px;">
              ${p.estado}
            </span>
            <span style="font-size:11px;font-weight:700;color:${p.ink};">ISP: ${p.ispTxt}</span>
          </div>
          <div style="font-size:11px;color:#4B5563;border-top:1px solid #E5E7EB;padding-top:4px;margin-top:4px;display:flex;align-items:center;justify-content:space-between;">
            <span>📅 ${p.fecha}</span>
            ${numFotos > 0 ? `<span style="color:#166534;font-weight:600;">📷 ${numFotos} adj.</span>` : ''}
          </div>
          <div style="font-size:10.5px;color:#E3002B;font-weight:700;margin-top:3px;">
            Clic para abrir ficha y evidencias →
          </div>
        </div>
      `;

      marker.bindTooltip(tooltipHtml, {
        direction: 'top',
        offset: [0, -(size / 2)],
        opacity: 0.98,
      });

      marker.on('click', () => {
        onSelectPunto(p.id);
      });

      marker.addTo(group);
    });

    // Renderizar los 21 Puntos de Acción Focalizada Octubre (En confirmación UAESP) con icono diferencial (Caneca + Ojo #7C3AED)
    puntosFocalizados.forEach((pf, idx) => {
      if (typeof pf.lat !== 'number' || typeof pf.lng !== 'number') return;
      if (isNaN(pf.lat) || isNaN(pf.lng)) return;

      if (pf.lat > 4.4) {
        coordsValidas.push([pf.lat, pf.lng]);
      }

      const isSelected = selectedFocalizadoId === pf.id;
      const wSize = isSelected ? 40 : 34;
      const hSize = isSelected ? 26 : 22;
      const borderStyle = isSelected ? '2.5px solid #111827' : '2px solid #FFFFFF';
      const shadowStyle = isSelected
        ? '0 0 0 3px rgba(124,58,237,0.45), 0 4px 10px rgba(0,0,0,0.4)'
        : '0 2px 6px rgba(88,28,135,0.45)';

      // Icono diferencial: Caneca + Ojo en cápsula púrpura (#7C3AED)
      const iconFocalizadoSvg = `
        <div style="display:flex;align-items:center;justify-content:center;gap:2px;">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#FEF08A" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      `;

      const customFocalizadoIcon = L.divIcon({
        className: 'radar-sost-marker',
        iconSize: [wSize, hSize],
        iconAnchor: [wSize / 2, hSize / 2],
        html: `
          <div style="
            width:${wSize}px;
            height:${hSize}px;
            background:linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
            border:${borderStyle};
            border-radius:9999px;
            box-shadow:${shadowStyle};
            display:flex;
            align-items:center;
            justify-content:center;
            cursor:pointer;
            transition:transform 0.12s ease;
          ">
            ${iconFocalizadoSvg}
          </div>
        `,
      });

      const markerFoc = L.marker([pf.lat, pf.lng], {
        icon: customFocalizadoIcon,
        zIndexOffset: isSelected ? 1100 : 450,
      });

      const tooltipFocHtml = `
        <div style="font-family:'Source Sans 3',system-ui,sans-serif;min-width:225px;max-width:290px;padding:2px 0;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px;">
            <span style="background:#7C3AED;color:#FFF;font-size:10px;font-weight:700;padding:1.5px 6px;border-radius:4px;">
              🗑️👁️ Punto en confirmación UAESP
            </span>
            <span style="font-size:11px;font-weight:700;color:#374151;">${pf.ld}</span>
          </div>
          <div style="font-size:12.5px;font-weight:700;color:#111827;line-height:1.25;margin-bottom:5px;white-space:normal;">
            #${idx + 1} · ${pf.d}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px;">
            <span style="background:#F3E8FF;color:#5B21B6;font-size:10.5px;font-weight:700;padding:2px 6px;border-radius:4px;">
              Acción focalizada octubre
            </span>
            <span style="font-size:11px;font-weight:700;color:#6D28D9;">ID: ${pf.uaespId}</span>
          </div>
          <div style="font-size:11px;color:#4B5563;border-top:1px solid #E5E7EB;padding-top:4px;margin-top:4px;display:flex;align-items:center;justify-content:space-between;">
            <span>📋 ${pf.acciones.length} ${pf.acciones.length === 1 ? 'acción prevista' : 'acciones previstas'}</span>
            <span style="color:#6D28D9;font-weight:700;">Oct 2026</span>
          </div>
          <div style="font-size:10.5px;color:#7C3AED;font-weight:700;margin-top:3px;">
            Clic para ver acciones previstas y responsable →
          </div>
        </div>
      `;

      markerFoc.bindTooltip(tooltipFocHtml, {
        direction: 'top',
        offset: [0, -(hSize / 2)],
        opacity: 0.98,
      });

      markerFoc.on('click', () => {
        onSelectFocalizado(pf.id);
      });

      markerFoc.addTo(group);
    });

    if (coordsValidas.length > 0 && coordsValidas.length < 95) {
      const bounds = L.latLngBounds(coordsValidas);
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
    }
  }, [puntos, puntosFocalizados, selectedId, onSelectPunto, selectedFocalizadoId, onSelectFocalizado]);

  const centrarBogota = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([4.645, -74.095], 11);
  };

  const verSumapaz = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([4.219, -74.189], 12);
  };

  const cS = puntos.filter(q => q.cls === 'S').length;
  const cA = puntos.filter(q => q.cls === 'A').length;
  const cN = puntos.filter(q => q.cls === 'N').length;
  const cV = puntos.filter(q => q.cls === 'V').length;
  const cP04 = puntos.filter(q => q.prod === 'P04').length;
  const cP05 = puntos.filter(q => q.prod === 'P05').length;
  const cFoc = puntosFocalizados.length;
  const totalEnVista = puntos.length + cFoc;

  return (
    <div id="mapa-sost" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>{`
        .leaflet-container {
          background: #EEF2F6 !important;
          font-family: "Source Sans 3", system-ui, sans-serif !important;
        }
        .leaflet-container img.leaflet-tile {
          max-width: none !important;
          max-height: none !important;
          width: 256px !important;
          height: 256px !important;
          visibility: visible !important;
          display: block !important;
        }
        .radar-sost-marker {
          background: transparent !important;
          border: none !important;
        }
        .radar-sost-marker > div:hover {
          transform: scale(1.18);
        }
      `}</style>

      {/* Cabecera del Mapa */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', flexWrap: 'wrap', gap: '12px 18px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: '#E3002B' }}>
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '16.5px', fontWeight: 700, color: '#1F2937' }}>
              Mapa territorial de puntos priorizados y acción focalizada ({totalEnVista} puntos en vista)
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>
              Haz clic sobre cualquier punto del mapa para desplegar su ficha de verificación o sus acciones previstas (puntos en confirmación UAESP).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Producto en el Mapa */}
          <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5 text-xs">
            {([
              { id: 'TODOS', label: 'Todos' },
              { id: 'P04', label: 'P04 Residuos' },
              { id: 'OCT21', label: '🗑️👁️ Confirmación UAESP (21)' },
              { id: 'P05', label: 'P05 Espacio público' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectProducto(tab.id)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  mapaProducto === tab.id
                    ? tab.id === 'OCT21'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Botón desplegable de Pestaña de Fechas */}
          <button
            type="button"
            onClick={() => setMostrarFechasTab(v => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              mostrarFechasTab || filtroFecha !== 'Todas'
                ? 'bg-red-50 border-red-300 text-red-800'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Desplegar pestaña de fechas de verificación"
          >
            <Calendar className="w-3.5 h-3.5 text-red-600" />
            <span>Fecha: {filtroFecha === 'Todas' ? '09–20 oct 2026' : filtroFecha}</span>
            <span className="text-[10px] ml-0.5">{mostrarFechasTab ? '▲' : '▼'}</span>
          </button>

          {/* Selector de Mapa Base: IDECA Bogotá / Calles / OSM / Satélite */}
          <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5 text-xs">
            {(
              [
                { id: 'ideca', label: 'IDECA Bogotá' },
                { id: 'calles', label: 'Calles' },
                { id: 'osm', label: 'OSM' },
                { id: 'satelite', label: 'Satélite' },
              ] as const
            ).map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => setCapaBase(b.id)}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  capaBase === b.id ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Toggle de Polígonos de Localidades */}
          <button
            type="button"
            onClick={() => setMostrarLocalidades(v => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
              mostrarLocalidades
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title="Mostrar u ocultar los límites de las 20 localidades de Bogotá"
          >
            Localidades
          </button>

          <button
            type="button"
            onClick={centrarBogota}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
            title="Restablecer vista general de Bogotá"
          >
            Bogotá
          </button>
          <button
            type="button"
            onClick={verSumapaz}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
            title="Enfocar puntos rurales en Sumapaz"
          >
            Sumapaz
          </button>
        </div>
      </div>

      {/* Pestaña desplegable de Fechas de Verificación al dar clic */}
      {mostrarFechasTab && (
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mr-1">
            Filtrar por fecha de visita:
          </span>
          <button
            type="button"
            onClick={() => onSelectFecha('Todas')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border cursor-pointer transition-colors ${
              filtroFecha === 'Todas'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            Todas las fechas
          </button>
          {fechasDisponibles.map(item => (
            <button
              key={item.fecha}
              type="button"
              onClick={() => onSelectFecha(item.fecha)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border cursor-pointer transition-colors inline-flex items-center gap-1.5 ${
                filtroFecha === item.fecha
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              <span>{item.fecha}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filtroFecha === item.fecha ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Lienzo del Mapa Leaflet */}
      <div className="relative w-full" style={{ height: '460px', zIndex: 1 }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '460px' }} />
      </div>

      {/* Pie / Leyenda del Mapa (Iconos por producto + Focalizados + Semáforo) */}
      <div style={{ padding: '10px 20px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', display: 'flex', flexWrap: 'wrap', gap: '10px 20px', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
        <div className="flex flex-wrap items-center gap-4">
          {/* Iconos por Producto */}
          <span className="inline-flex items-center gap-1.5 font-bold text-gray-800 pr-2 border-r border-gray-300">
            <span className="w-5 h-5 rounded-full bg-gray-800 text-white inline-flex items-center justify-center shadow-2xs">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </span>
            P04 Residuos ({cP04})
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold text-purple-900 pr-2 border-r border-gray-300">
            <span
              className="px-1.5 h-5 rounded-full text-white inline-flex items-center justify-center gap-0.5 shadow-2xs"
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)' }}
            >
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#FEF08A" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            En confirmación UAESP · Acción Focalizada Oct ({cFoc})
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold text-gray-800 pr-3 border-r border-gray-300">
            <span className="w-5 h-5 rounded-md bg-gray-800 text-white inline-flex items-center justify-center shadow-2xs">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 21h20" />
                <path d="M6 13a3 3 0 1 0-1-5.8 3 3 0 0 0-2 2.8c0 1.7 1.3 3 3 3z" />
                <path d="M6 13v8" />
                <path d="M10 13h4v3h-4z" />
                <path d="M9 16h6" />
                <path d="M10 16v5" />
                <path d="M14 16v5" />
                <path d="M19 5a1.5 1.5 0 0 1 1.5 1.5L20 8h-2l-.5-1.5A1.5 1.5 0 0 1 19 5z" />
                <path d="M19 8v13" />
              </svg>
            </span>
            P05 Espacio público ({cP05})
          </span>

          {/* Semáforo de Clasificación */}
          <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
            <span className="w-3 h-3 rounded-full inline-block border border-white shadow-2xs" style={{ background: '#16A34A' }} />
            Sostenido ({cS})
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
            <span className="w-3 h-3 rounded-full inline-block border border-white shadow-2xs" style={{ background: '#F59E0B' }} />
            En riesgo ({cA})
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
            <span className="w-3 h-3 rounded-full inline-block border border-white shadow-2xs" style={{ background: '#E3002B' }} />
            Recaída confirmada ({cN})
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
            <span className="w-3 h-3 rounded-full inline-block border border-white shadow-2xs" style={{ background: '#6B7280' }} />
            Sin verificación ({cV})
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Haz clic en cualquier icono para abrir su <strong>Ficha de punto</strong> o <strong>Acciones previstas</strong>.
        </div>
      </div>
    </div>
  );
}

export default function SeccionSostenibilidadEP({ userData }: Props) {
  const [snapshot, setSnapshot] = useState<SnapshotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Ventana modal de Ficha de Punto (null = cerrada) y modal de Punto Focalizado Octubre
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFocalizadoId, setSelectedFocalizadoId] = useState<string | null>(null);
  const [zoomIdx, setZoomIdx] = useState<number | null>(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  // Filtros interactivos
  const [filtroTrimestre, setFiltroTrimestre] = useState<'TODOS' | 'T1' | 'T2'>('TODOS');
  const [filtroLocalidad, setFiltroLocalidad] = useState<string>('Todas');
  const [filtroClasificacion, setFiltroClasificacion] = useState<string>('Todas');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('Todas');
  const [filtroFecha, setFiltroFecha] = useState<string>('Todas');
  const [mapaProducto, setMapaProducto] = useState<FiltroMapaProducto>('TODOS');

  // Modal de configuración de credenciales/token ArcGIS
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [arcgisUser, setArcgisUser] = useState('profesionalOEP');
  const [arcgisPass, setArcgisPass] = useState('');
  const [arcgisToken, setArcgisToken] = useState('');

  // Modal para Exportar Informe Consolidado (Residuos P04, Espacio Público P05 o Ambos)
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTab, setExportTab] = useState<'P04' | 'P05' | 'AMBOS'>('AMBOS');
  const [generandoConsolidadoPdf, setGenerandoConsolidadoPdf] = useState(false);

  const abrirModalPunto = useCallback((id: string) => {
    setSelectedFocalizadoId(null);
    setSelectedId(id);
    setZoomIdx(0); // Mostrar el primer adjunto seleccionado por defecto en la ventana
  }, []);

  const cerrarModalPunto = useCallback(() => {
    setSelectedId(null);
    setZoomIdx(null);
  }, []);

  const abrirModalFocalizado = useCallback((id: string) => {
    setSelectedId(null);
    setSelectedFocalizadoId(id);
  }, []);

  const cerrarModalFocalizado = useCallback(() => {
    setSelectedFocalizadoId(null);
  }, []);

  const cargarCopiaEnLinea = useCallback(async () => {
    try {
      const res = await fetchApi(`${API}/api/sostenibilidad`);
      if (res.ok) {
        const data: SnapshotResponse = await res.json();
        setSnapshot(data);
      }
    } catch (err) {
      console.error('Error cargando copia en línea de sostenibilidad:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const ejecutarActualizacion = useCallback(
    async (origen: 'MANUAL' | 'AUTOMATICO' = 'MANUAL', customAuth?: { username?: string; password?: string; token?: string }) => {
      setSyncing(true);
      if (origen === 'MANUAL') setSyncNotice(null);
      try {
        const res = await fetchApi(`${API}/api/sostenibilidad/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origen,
            username: customAuth?.username || (arcgisUser ? arcgisUser : undefined),
            password: customAuth?.password || (arcgisPass ? arcgisPass : undefined),
            token: customAuth?.token || (arcgisToken ? arcgisToken : undefined),
          }),
        });
        if (res.ok) {
          const data: SnapshotResponse = await res.json();
          setSnapshot(data);
          if (origen === 'MANUAL') {
            setSyncNotice({
              text: data.message || 'Copia en línea actualizada y guardada correctamente.',
              ok: data.arcgisConnected !== false,
            });
          }
        } else {
          if (origen === 'MANUAL') {
            setSyncNotice({ text: 'Error al comunicar con el servidor para sincronizar.', ok: false });
          }
        }
      } catch (err) {
        console.error('Error sincronizando sostenibilidad:', err);
        if (origen === 'MANUAL') {
          setSyncNotice({ text: 'Error de red al intentar actualizar.', ok: false });
        }
      } finally {
        setSyncing(false);
      }
    },
    [arcgisUser, arcgisPass, arcgisToken]
  );

  // Carga inicial desde la copia guardada en línea (Supabase)
  useEffect(() => {
    cargarCopiaEnLinea();
  }, [cargarCopiaEnLinea]);

  // Refresco automático cada 5 minutos cuando autoRefresh está activo
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      ejecutarActualizacion('AUTOMATICO');
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, ejecutarActualizacion]);

  if (loading || !snapshot?.datos) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-xs">
        <div className="inline-block w-8 h-8 border-4 border-bogota-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-600 font-medium">Cargando Tablero de Sostenibilidad Espacio Público...</p>
      </div>
    );
  }

  const datos = snapshot.datos;

  // Asegurar que en P05 Plazoleta Codensa aparezca una sola vez (deduplicación preventiva por localidad + dirección)
  const deduplicarPuntos = (lista: PuntoRaw[]) => {
    const vistos = new Set<string>();
    return lista.filter(p => {
      const clave = `${p.prod}|${p.ld.toLowerCase().trim()}|${p.d.toLowerCase().trim()}`;
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    });
  };

  const baseP04 = deduplicarPuntos(datos.puntosP04 || []);
  const baseP05 = deduplicarPuntos(datos.puntosP05 || []);

  // Extraer fechas únicas de visita para desplegar la pestaña de fechas
  const extraerDiaFecha = (f: string) => {
    if (!f || f === '—') return 'Sin visita';
    return f.split(',')[0].trim();
  };

  const conteoFechasMap = new Map<string, number>();
  [...baseP04, ...baseP05].forEach(p => {
    const dia = extraerDiaFecha(p.fecha);
    conteoFechasMap.set(dia, (conteoFechasMap.get(dia) || 0) + 1);
  });

  const fechasDisponibles = Array.from(conteoFechasMap.entries())
    .map(([fecha, count]) => ({ fecha, count }))
    .sort((a, b) => {
      if (a.fecha === 'Sin visita') return 1;
      if (b.fecha === 'Sin visita') return -1;
      const numA = parseInt(a.fecha, 10) || 0;
      const numB = parseInt(b.fecha, 10) || 0;
      return numA - numB;
    });

  // Función de filtrado de puntos
  const filtrarPuntos = (lista: PuntoRaw[]) => {
    return lista.filter(p => {
      if (filtroTrimestre !== 'TODOS' && p.t !== filtroTrimestre) return false;
      if (filtroLocalidad !== 'Todas' && p.ld !== filtroLocalidad) return false;
      if (filtroClasificacion !== 'Todas' && p.cls !== filtroClasificacion) return false;
      if (filtroPrioridad === 'En riesgo o recaída' && p.cls !== 'A' && p.cls !== 'N') return false;
      if (filtroPrioridad === 'Sin verificar' && p.cls !== 'V') return false;
      if (filtroFecha !== 'Todas') {
        const dia = extraerDiaFecha(p.fecha);
        if (dia !== filtroFecha) return false;
      }
      return true;
    });
  };

  const enriquecerPuntos = (rows: PuntoRaw[]): PuntoEnriquecido[] => {
    return rows.map((r, idx) => {
      const c = CH[r.cls] || CH.V;
      const rawIdx = parseInt(r.id.split('-')[1] || String(idx), 10);
      const fallbackCoord = r.prod === 'P04' ? COORDS_P04[rawIdx] : COORDS_P05[rawIdx];
      return {
        ...r,
        i: isNaN(rawIdx) ? idx + 1 : rawIdx + 1,
        lat: r.lat ?? fallbackCoord?.[0],
        lng: r.lng ?? fallbackCoord?.[1],
        estado: c.t,
        chipBg: c.bg,
        chipFg: c.fg,
        ink: c.ink,
        ispTxt: r.isp === null || r.isp === undefined ? '—' : String(r.isp),
        bg: r.cls === 'V' ? '#F9FAFB' : '#FFFFFF',
      };
    });
  };

  const p04Full = enriquecerPuntos(baseP04);
  const p05Full = enriquecerPuntos(baseP05);
  const p04 = enriquecerPuntos(filtrarPuntos(baseP04));
  const p05 = enriquecerPuntos(filtrarPuntos(baseP05));
  const todosFull = [...p04Full, ...p05Full];
  const puntosMapa =
    mapaProducto === 'OCT21'
      ? []
      : mapaProducto === 'P04'
      ? p04
      : mapaProducto === 'P05'
      ? p05
      : [...p04, ...p05];

  const puntosFocalizadosMapa =
    mapaProducto === 'P05'
      ? []
      : PUNTOS_FOCALIZADOS_OCT_2026.filter(pf => filtroLocalidad === 'Todas' || pf.ld === filtroLocalidad);

  const selFocalizado = selectedFocalizadoId
    ? PUNTOS_FOCALIZADOS_OCT_2026.find(pf => pf.id === selectedFocalizadoId) || null
    : null;

  const agruparSinVerificar = (list: typeof p04) => {
    const byLoc: Record<string, { t: string; d: string }[]> = {};
    const orden: string[] = [];
    list.forEach(q => {
      if (q.cls !== 'V') return;
      if (!byLoc[q.ld]) {
        byLoc[q.ld] = [];
        orden.push(q.ld);
      }
      byLoc[q.ld].push({ t: q.t, d: q.d });
    });
    return orden
      .map(ld => {
        const n = byLoc[ld].length;
        return { ld, n, items: byLoc[ld], acc: n > 1 ? '#E3002B' : '#9CA3AF' };
      })
      .sort((a, b) => b.n - a.n);
  };

  const calcularResumen = (list: typeof p04) => {
    const s = list.filter(q => q.cls === 'S').length;
    const a = list.filter(q => q.cls === 'A').length;
    const n = list.filter(q => q.cls === 'N').length;
    const v = list.filter(q => q.cls === 'V').length;
    const ver = s + a + n;
    const sost = s + a;
    const rawPct = ver > 0 ? (sost / ver) * 100 : 0;
    const pct = rawPct % 1 === 0 ? rawPct : Number(rawPct.toFixed(1));
    const pctTxt = rawPct % 1 === 0 ? String(rawPct) : rawPct.toFixed(1).replace('.', ',');
    return { s, a, n, v, ver, pri: list.length, sost, pct, pctTxt };
  };

  const r4 = calcularResumen(p04);
  const r5 = calcularResumen(p05);
  const r4Full = calcularResumen(p04Full);
  const r5Full = calcularResumen(p05Full);
  const rTotalFull = calcularResumen(todosFull);
  const sv04 = agruparSinVerificar(p04);
  const sv05 = agruparSinVerificar(p05);

  const armarSeccionProducto = (
    cod: 'P04' | 'P05',
    nombre: string,
    anchor: string,
    R: ReturnType<typeof calcularResumen>,
    list: typeof p04,
    sv: ReturnType<typeof agruparSinVerificar>,
    critTitulo: string,
    criterios: { label: string; ok: number; n?: number; color: string }[],
    riesgoTitulo: string,
    riesgos: { label: string; n: number; w: number }[],
    apro: { label: string; pct: number | null; n?: number; color: string }[]
  ) => {
    const t1 = list.filter(q => q.t === 'T1').length;
    const safeVer = R.ver || 1;
    return {
      cod,
      nombre,
      anchor,
      puntos: list,
      sinVer: sv,
      pri: R.pri,
      ver: R.ver,
      sost: R.sost,
      sv: R.v,
      pct: R.pct,
      pctTxt: R.pctTxt,
      t1,
      t2: R.pri - t1,
      svLoc: sv.length,
      wS: R.ver ? (R.s / safeVer) * 100 : 0,
      wA: R.ver ? (R.a / safeVer) * 100 : 0,
      wN: R.ver ? (R.n / safeVer) * 100 : 0,
      detalle: [
        { k: 'Sostenido', v: R.s, pct: (R.ver ? Math.round((R.s / safeVer) * 100) : 0) + '%', sub: 'Cuenta como sostenido', color: '#16A34A' },
        { k: 'En riesgo', v: R.a, pct: (R.ver ? Math.round((R.a / safeVer) * 100) : 0) + '%', sub: 'También cuenta como sostenido', color: '#9A3412' },
        { k: 'Recaída confirmada', v: R.n, pct: (R.ver ? Math.round((R.n / safeVer) * 100) : 0) + '%', sub: 'Única clase no sostenida', color: '#E3002B' },
      ],
      critTitulo,
      criterios,
      riesgoTitulo,
      riesgos,
      apropiacionTitulo: cod === 'P05' ? 'Acciones de gestión y control desplegadas' : 'Apropiación y permanencia',
      apropiacion: apro.map(a => ({
        label: a.label,
        color: a.color,
        txt: a.pct === null ? 'n/a' : `${a.pct}%`,
        n: a.n,
      })),
    };
  };

  // Calcular vocación de P05 dinámicamente desde los puntos verificados de P05 (Ventas informales vs Parqueo indebido)
  const p05Verificados = p05.filter(q => q.cls === 'S' || q.cls === 'A' || q.cls === 'N');
  const p05Parqueo = p05Verificados.filter(q => q.riesgo.toLowerCase().includes('parqueo'));
  const p05Ventas = p05Verificados.filter(q => !q.riesgo.toLowerCase().includes('parqueo'));

  const construirVocacionGrupo = (
    key: 'ventas' | 'parqueo',
    label: string,
    sublabel: string,
    lista: typeof p05Verificados
  ): VocacionP05Item => {
    const total = lista.length;
    const sostenidos = lista.filter(q => q.cls === 'S').length;
    const enRiesgo = lista.filter(q => q.cls === 'A').length;
    const recaida = lista.filter(q => q.cls === 'N').length;
    const rawPct = total > 0 ? ((sostenidos + enRiesgo) / total) * 100 : 0;
    const pctSostenimiento = Math.round(rawPct);
    const pctSostenimientoTxt = rawPct % 1 === 0 ? `${rawPct}%` : `${rawPct.toFixed(1).replace('.', ',')}%`;
    return {
      key,
      label,
      sublabel,
      total,
      sostenidos,
      enRiesgo,
      recaida,
      pctSostenimiento,
      pctSostenimientoTxt,
      color: rawPct >= 69 ? '#16A34A' : '#9A3412',
    };
  };

  const vocacionP05List: VocacionP05Item[] = [
    construirVocacionGrupo(
      'ventas',
      'Puntos de Ventas Informales',
      'Recuperación ante ocupación comercial y mobiliario no autorizado',
      p05Ventas
    ),
    construirVocacionGrupo(
      'parqueo',
      'Puntos de Parqueo Indebido',
      'Recuperación de andenes, bahías y zonas peatonales invadidas por vehículos',
      p05Parqueo
    ),
  ];

  const maxRiesgoP05 = Math.max(p05Ventas.length, p05Parqueo.length, 1);
  const riesgosP05Calculados = [
    { label: 'Ventas informales', n: p05Ventas.length, w: Math.round((p05Ventas.length / maxRiesgoP05) * 100) },
    { label: 'Parqueo indebido', n: p05Parqueo.length, w: Math.round((p05Parqueo.length / maxRiesgoP05) * 100) },
  ];

  const defaultCondicionesP05: CondicionP05Item[] = [
    { label: 'Espacio libre de ocupación', total: 19, parcial: 18, no: 7, pctTotal: 43, pctParcial: 41, pctNo: 16, pctAvance: 64 },
    { label: 'Condiciones físicas adecuadas', total: 19, parcial: 18, no: 7, pctTotal: 43, pctParcial: 41, pctNo: 16, pctAvance: 64 },
    { label: 'Apropiación del espacio recuperado', total: 18, parcial: 18, no: 8, pctTotal: 41, pctParcial: 41, pctNo: 18, pctAvance: 61 },
  ];

  const condicionesP05List: CondicionP05Item[] =
    datos.condicionesP05 && datos.condicionesP05.length > 0
      ? datos.condicionesP05.map((raw: any, idx: number) => {
          const fb = defaultCondicionesP05[idx] || defaultCondicionesP05[0];
          const totalN = Number(raw.totalN ?? 44) || 44;
          const pctTotal = Number(raw.pctTotal ?? raw.totalPct ?? fb.pctTotal);
          const pctParcial = Number(raw.pctParcial ?? raw.parcialPct ?? fb.pctParcial);
          const pctNo = Number(raw.pctNo ?? raw.noPct ?? Math.max(0, 100 - pctTotal - pctParcial));
          const total = Number(raw.total ?? Math.round((pctTotal * totalN) / 100));
          const parcial = Number(raw.parcial ?? Math.round((pctParcial * totalN) / 100));
          const no = Number(raw.no ?? Math.max(0, totalN - total - parcial));
          const pctAvance = Number(raw.pctAvance ?? Math.round(((total + parcial * 0.5) / totalN) * 100));
          return {
            label: raw.label || fb.label,
            total,
            parcial,
            no,
            pctTotal,
            pctParcial,
            pctNo,
            pctAvance,
          };
        })
      : defaultCondicionesP05;

  const productos = [
    armarSeccionProducto(
      'P04',
      'Transformación de la gestión de residuos',
      'p04',
      r4,
      p04,
      sv04,
      'Principales acciones de apropiación',
      datos.criteriosP04,
      'Principal factor de riesgo identificado',
      datos.riesgosP04,
      datos.apropiacionP04
    ),
    armarSeccionProducto(
      'P05',
      'Transformación de la organización y recuperación del espacio público',
      'p05',
      r5,
      p05,
      sv05,
      'Sostenimiento según problemática del punto',
      datos.criteriosP05,
      'Principal riesgo de recaída',
      riesgosP05Calculados,
      datos.apropiacionP05
    ),
  ];

  // Matriz por localidad
  const agrupaPorLocalidad = (list: typeof p04Full, ld: string) => {
    const f = list.filter(q => q.ld === ld);
    const pri = f.length;
    const sost = f.filter(q => q.cls === 'S' || q.cls === 'A').length;
    const no = f.filter(q => q.cls === 'N').length;
    const sv = f.filter(q => q.cls === 'V').length;
    const w = (n: number) => (pri ? (n / pri) * 100 : 0);
    return {
      pri: pri || '—',
      sost: pri ? sost : '—',
      noSost: pri ? no : '—',
      sv: pri ? sv : '—',
      wS: w(sost),
      wN: w(no),
      wV: w(sv),
      sC: pri && sost > 0 ? '#16A34A' : '#9CA3AF',
      nC: pri && no > 0 ? '#E3002B' : '#9CA3AF',
      cero: pri > 0 && sost === 0,
    };
  };

  const matriz = CODS.map(([cod, ld]) => {
    const a = agrupaPorLocalidad(p04Full, ld);
    const b = agrupaPorLocalidad(p05Full, ld);
    const al = a.cero || b.cero;
    return {
      cod,
      ld,
      p4: a,
      p5: b,
      fw: al ? 700 : 400,
      rowBg: al ? '#FFF7ED' : '#FFFFFF',
    };
  });

  // Punto seleccionado para la ventana modal de Ficha
  const sel = selectedId ? todosFull.find(q => q.id === selectedId) || null : null;
  const esV = sel?.cls === 'V';
  const stamp = `2026101${((sel?.i || 1) % 9) + 1}09${40 + ((sel?.i || 1) % 20)}12`;

  const evidenciasFicha =
    !sel || esV
      ? []
      : sel.evidencias && sel.evidencias.length > 0
      ? sel.evidencias
      : [
          { label: 'Fotografía del estado actual', file: `fotografia_del_estado_actual_${stamp}.jpg`, contentType: 'image/jpeg' },
          { label: 'Fotografía 2 del estado actual', file: `fotografia2_estado_actual_${stamp}.jpg`, contentType: 'image/jpeg' },
          { label: 'Video corto del punto', file: `video_estado_actual_${stamp}.MOV`, contentType: 'video/quicktime' },
        ];

  const construirCriteriosPunto = (punto: PuntoEnriquecido) => {
    if (punto.criteriosDetalle && punto.criteriosDetalle.length > 0) {
      return punto.criteriosDetalle.map(c => ({
        k: c.k,
        v: c.v,
        mark: c.ok ? '✓' : '✕',
        bg: c.ok ? '#16A34A' : '#E3002B',
      }));
    }
    const keys = punto.prod === 'P04' ? F04 : F05;
    const n = keys.length;
    const ok = punto.cls === 'S' ? n : punto.cls === 'A' ? n - 2 : punto.cls === 'N' ? 1 : 0;
    return keys.map((k, idx) => {
      const v = idx < ok;
      return {
        k,
        v: v ? 'Sí' : 'No',
        mark: v ? '✓' : '✕',
        bg: v ? '#16A34A' : '#E3002B',
      };
    });
  };

  const criteriosFicha = sel ? construirCriteriosPunto(sel) : [];

  const exportarFichaPdfCarta = async () => {
    const el = document.getElementById('ficha-imprimible-carta');
    if (!el) return;
    setGenerandoPdf(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });
      const pageWidth = 215.9;
      const pageHeight = 279.4;
      const margin = 8;
      const contentWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = margin;
        const usableHeight = pageHeight - margin * 2;
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgHeight);
        heightLeft -= usableHeight;
        while (heightLeft > 0) {
          position = position - usableHeight;
          pdf.addPage('letter', 'portrait');
          pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgHeight);
          heightLeft -= usableHeight;
        }
      }
      const nombreLimpio = `Ficha_Sostenibilidad_${sel?.ld || 'Bogota'}_${sel?.prod || 'P'}_${sel?.id || 'Punto'}`.replace(/[\s/\\:]+/g, '_');
      pdf.save(`${nombreLimpio}.pdf`);
    } catch (err) {
      console.error('Error al exportar ficha en PDF:', err);
      alert('Hubo un inconveniente al generar el PDF. Por favor utiliza la opción de Imprimir.');
    } finally {
      setGenerandoPdf(false);
    }
  };

  const imprimirFichaCarta = () => {
    window.print();
  };

  const exportarConsolidadoPdfCarta = async () => {
    const pageNodes = document.querySelectorAll<HTMLElement>('.hoja-carta-exportable');
    if (!pageNodes || pageNodes.length === 0) return;
    setGenerandoConsolidadoPdf(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });
      const pageWidth = 215.9;
      const pageHeight = 279.4;

      for (let i = 0; i < pageNodes.length; i++) {
        if (i > 0) {
          pdf.addPage('letter', 'portrait');
        }
        const canvas = await html2canvas(pageNodes[i], {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
      }

      const sufijo = exportTab === 'P04' ? 'Residuos_P04' : exportTab === 'P05' ? 'Espacio_Publico_P05' : 'Consolidado_Distrital_P04_P05';
      pdf.save(`Informe_Sostenibilidad_${sufijo}_Corte_15Oct2026.pdf`);
    } catch (err) {
      console.error('Error generando PDF consolidado:', err);
      alert('Hubo un inconveniente al generar el PDF.');
    } finally {
      setGenerandoConsolidadoPdf(false);
    }
  };

  const abrirModalPuntoYExportar = (id: string) => {
    setSelectedFocalizadoId(null);
    setSelectedId(id);
    setZoomIdx(0);
    setTimeout(() => {
      exportarFichaPdfCarta();
    }, 600);
  };

  const formatearFechaLectura = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return '20/10/2026 10:14';
    }
  };

  const hayFiltrosActivos =
    filtroTrimestre !== 'TODOS' ||
    filtroLocalidad !== 'Todas' ||
    filtroClasificacion !== 'Todas' ||
    filtroPrioridad !== 'Todas' ||
    filtroFecha !== 'Todas';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
        background: '#F9FAFB',
        fontFamily: '"Source Sans 3", "Segoe UI", system-ui, sans-serif',
        color: '#1F2937',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Source+Sans+3:wght@400;600;700&display=swap"
      />

      {/* Franja institucional roja superior */}
      <div style={{ height: '4px', background: '#E3002B' }} />

      {/* Barra superior de navegación rápida y sincronización */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '12px 32px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 22px', alignItems: 'center', justifyContent: 'space-between' }}>
          <nav aria-label="Secciones de la página" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minWidth: 0, flex: '1 1 auto', justifyContent: 'flex-start' }}>
            {[
              { href: '#mapa-sost', label: 'Mapa' },
              { href: '#p04', label: 'P04 Residuos' },
              { href: '#p05', label: 'P05 Espacio público' },
              { href: '#localidades-sost', label: 'Localidades' },
              { href: '#metodo-sost', label: 'Método' },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  fontFamily: 'Archivo, system-ui, sans-serif',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  background: '#FFFFFF',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '0 14px',
                  minHeight: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                }}
                className="hover:bg-gray-50 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Controles de sincronización en línea y conexión Survey123 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white shadow-xs transition-all cursor-pointer bg-purple-700 hover:bg-purple-800"
              style={{ fontFamily: 'Archivo, system-ui, sans-serif' }}
              title="Abrir panel para exportar informe consolidado de Residuos, Espacio Público o Ambos"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Informe (Carta)</span>
            </button>

            <button
              type="button"
              onClick={() => ejecutarActualizacion('MANUAL')}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-60"
              style={{ background: '#E3002B', fontFamily: 'Archivo, system-ui, sans-serif' }}
              title="Consultar Survey123 en vivo y guardar copia en línea en RADAR"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Actualizando...' : 'Actualizar ahora'}
            </button>

            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
              title="Configurar credenciales o token de ArcGIS Survey123"
            >
              <Settings className="w-3.5 h-3.5 text-gray-500" />
              ArcGIS
            </button>

            <a
              href={SURVEY_SHARE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Abrir Survey123 en pestaña nueva"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Survey123
            </a>
          </div>
        </div>
      </div>

      {/* Notificación de resultado de sincronización */}
      {syncNotice && (
        <div
          className={`px-8 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
            syncNotice.ok ? 'bg-green-50 text-green-800 border-green-200' : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncNotice.ok ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
            <span>{syncNotice.text}</span>
          </div>
          <button onClick={() => setSyncNotice(null)} className="text-gray-500 hover:text-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Encabezado principal del tablero */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '18px 32px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 24px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ minWidth: 0, flex: '1 1 520px' }}>
            <h1 style={{ margin: 0, fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '26px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-.01em', color: '#1F2937' }}>
              Transformación Territorial del Espacio Público · Residuos y Ventas Informales
            </h1>
          </div>
          <div style={{ flex: 'none', textAlign: 'right', fontSize: '12.5px', color: '#6B7280', lineHeight: 1.65 }}>
            <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontWeight: 600, color: '#1F2937', fontSize: '12px', letterSpacing: '.06em', textTransform: 'uppercase' }} className="flex items-center justify-end gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-600 inline-block animate-pulse" />
              Actualización en línea
            </div>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              Última lectura {formatearFechaLectura(snapshot.ultimaLectura)}
            </span>{' '}
            ·{' '}
            <button
              type="button"
              onClick={() => setAutoRefresh(v => !v)}
              className="underline hover:text-gray-900 cursor-pointer"
              title="Activar o pausar actualización automática cada 5 min"
            >
              {autoRefresh ? 'refresco 5 min' : 'refresco pausado'}
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros Interactivos */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '14px 32px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '10.5px', fontWeight: 600, letterSpacing: '.13em', color: '#6B7280', textTransform: 'uppercase', marginRight: '4px' }}>
          Filtros
        </span>

        {/* Trimestre */}
        <label className="inline-flex items-center gap-2 text-xs bg-white border border-gray-300 rounded-lg px-3 py-2">
          <span className="text-gray-500">Trimestre</span>
          <select
            value={filtroTrimestre}
            onChange={e => setFiltroTrimestre(e.target.value as any)}
            className="font-semibold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="TODOS">T1 + T2</option>
            <option value="T1">T1</option>
            <option value="T2">T2</option>
          </select>
        </label>

        {/* Localidad */}
        <label className="inline-flex items-center gap-2 text-xs bg-white border border-gray-300 rounded-lg px-3 py-2">
          <span className="text-gray-500">Localidad</span>
          <select
            value={filtroLocalidad}
            onChange={e => setFiltroLocalidad(e.target.value)}
            className="font-semibold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="Todas">Todas</option>
            {CODS.map(([cod, nombre]) => (
              <option key={cod} value={nombre}>
                {cod}. {nombre}
              </option>
            ))}
          </select>
        </label>

        {/* Clasificación */}
        <label className="inline-flex items-center gap-2 text-xs bg-white border border-gray-300 rounded-lg px-3 py-2">
          <span className="text-gray-500">Clasificación</span>
          <select
            value={filtroClasificacion}
            onChange={e => setFiltroClasificacion(e.target.value)}
            className="font-semibold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="Todas">Todas</option>
            <option value="S">Sostenido</option>
            <option value="A">En riesgo</option>
            <option value="N">Recaída confirmada</option>
            <option value="V">Sin verificación</option>
          </select>
        </label>

        {/* Prioridad */}
        <label className="inline-flex items-center gap-2 text-xs bg-white border border-gray-300 rounded-lg px-3 py-2">
          <span className="text-gray-500">Prioridad</span>
          <select
            value={filtroPrioridad}
            onChange={e => setFiltroPrioridad(e.target.value)}
            className="font-semibold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="Todas">Todas</option>
            <option value="En riesgo o recaída">En riesgo / Recaída</option>
            <option value="Sin verificar">Pendientes de visita</option>
          </select>
        </label>

        {/* Periodo visita / Fecha desplegable al dar clic */}
        <label className="inline-flex items-center gap-2 text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-400 transition-colors">
          <span className="text-gray-500">Periodo visita</span>
          <select
            value={filtroFecha}
            onChange={e => setFiltroFecha(e.target.value)}
            className="font-semibold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="Todas">{datos.periodoVisita} (Todas)</option>
            {fechasDisponibles.map(item => (
              <option key={item.fecha} value={item.fecha}>
                {item.fecha} ({item.count} puntos)
              </option>
            ))}
          </select>
        </label>

        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={() => {
              setFiltroTrimestre('TODOS');
              setFiltroLocalidad('Todas');
              setFiltroClasificacion('Todas');
              setFiltroPrioridad('Todas');
              setFiltroFecha('Todas');
            }}
            className="text-xs font-semibold text-bogota-primary hover:underline px-2 py-1 cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}

        <span style={{ flex: '1 1 20px' }} />
        <span style={{ fontSize: '12.5px', color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}>
          Total priorizados:{' '}
          <strong style={{ color: '#1F2937' }}>
            {p04Full.length} en P04 + {p05Full.length} en P05 = {p04Full.length + p05Full.length}
          </strong>{' '}
          · Focalizados Oct: <strong style={{ color: '#6D28D9' }}>{PUNTOS_FOCALIZADOS_OCT_2026.length} UAESP</strong>
        </span>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ padding: '26px 32px 40px', display: 'flex', flexDirection: 'column', gap: '26px' }}>
        {/* MAPA TERRITORIAL INTERACTIVO DE PUNTOS */}
        <MapaPuntosSostenibilidad
          puntos={puntosMapa}
          puntosFocalizados={puntosFocalizadosMapa}
          fechasDisponibles={fechasDisponibles}
          filtroFecha={filtroFecha}
          onSelectFecha={setFiltroFecha}
          mapaProducto={mapaProducto}
          onSelectProducto={setMapaProducto}
          selectedId={selectedId}
          onSelectPunto={abrirModalPunto}
          selectedFocalizadoId={selectedFocalizadoId}
          onSelectFocalizado={abrirModalFocalizado}
        />

        {/* SECCIONES POR PRODUCTO (P04 y P05) */}
        {productos.map(p => (
          <div key={p.cod} id={p.anchor} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
            {/* Cabecera del Producto */}
            <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '17px', fontWeight: 700, background: '#E3002B', color: '#FFFFFF', padding: '6px 12px', borderRadius: '6px', flex: 'none' }}>
                {p.cod}
              </span>
              <span style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '17px', fontWeight: 600, lineHeight: 1.25, minWidth: 0, flex: '1 1 320px', color: '#1F2937' }}>
                {p.nombre}
              </span>
              <span style={{ fontSize: '12.5px', color: '#6B7280', flex: 'none', fontVariantNumeric: 'tabular-nums' }}>
                {p.pri} puntos priorizados · T1 {p.t1} · T2 {p.t2}
              </span>
            </div>

            {/* BLOQUES DEL TABLERO DE GESTIÓN DE RESIDUOS (P04) — antes de Sostenimiento */}
            {p.cod === 'P04' && (
              <BloquesGestionP04
                gestion={GESTION_P04_DEFAULT}
                totalIntervencionesLive={datos.totalIntervencionesP04}
                onVerFocalizadosEnMapa={() => {
                  setMapaProducto('OCT21');
                  document.getElementById('mapa-sost')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            )}

            {/* HERO: porcentaje de sostenimiento */}
            <div style={{ padding: '24px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', flexWrap: 'wrap', gap: '28px 36px', alignItems: 'center' }}>
              <div style={{ flex: '0 0 auto', minWidth: 0 }}>
                <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '12px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '4px' }}>
                  Sostenimiento
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '86px', fontWeight: 700, lineHeight: 0.92, fontVariantNumeric: 'tabular-nums', color: '#16A34A', letterSpacing: '-.02em' }}>
                    {p.pctTxt}
                  </span>
                  <span style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '34px', fontWeight: 700, color: '#16A34A' }}>
                    %
                  </span>
                </div>
                <div style={{ fontSize: '13.5px', color: '#4B5563', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                  {p.sost} de {p.ver} puntos verificados ({p.pctTxt}%)
                </div>
              </div>

              <div style={{ flex: '1 1 420px', minWidth: 0 }}>
                <div style={{ display: 'flex', height: '30px', width: '100%', borderRadius: '6px', overflow: 'hidden', background: '#F3F4F6' }}>
                  <div style={{ width: `${p.wS}%`, background: '#16A34A' }} />
                  <div style={{ width: `${p.wA}%`, background: '#FFCD00' }} />
                  <div style={{ width: `${p.wN}%`, background: '#E3002B' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginTop: '14px' }}>
                  {p.detalle.map(d => (
                    <div
                      key={d.k}
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '11px 13px',
                        borderLeft: `4px solid ${d.color}`,
                        minWidth: 0,
                      }}
                    >
                      <div style={{ fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#6B7280', fontFamily: 'Archivo, system-ui, sans-serif', fontWeight: 600 }}>
                        {d.k}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', marginTop: '3px' }}>
                        <span style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '26px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: d.color }}>
                          {d.v}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}>{d.pct}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex: '0 0 auto', borderLeft: '1px solid #E5E7EB', paddingLeft: '28px', minWidth: 0 }}>
                <div style={{ fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#6B7280', fontFamily: 'Archivo, system-ui, sans-serif', fontWeight: 600 }}>
                  Sin verificación
                </div>
                <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '34px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#6B7280', lineHeight: 1.1 }}>
                  {p.sv}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}>de {p.pri} priorizados</div>
              </div>
            </div>

            {/* Criterios / Problemática del punto y Riesgos / Acciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5 border-b border-gray-200">
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: '0 0 12px', fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '15px', fontWeight: 700 }}>{p.critTitulo}</h3>

                {p.cod === 'P04' ? (
                  /* P04: Principales acciones de apropiación (Survey123 que_acciones_apropiacion) */
                  <div>
                    {p.criterios.map(c => (
                      <div key={c.label} style={{ marginBottom: '11px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                          <span style={{ flex: '1 1 auto', minWidth: 0, fontSize: '13.5px' }}>{c.label}</span>
                          {c.n !== undefined && (
                            <span style={{ flex: 'none', fontSize: '12px', color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}>
                              {c.n} {c.n === 1 ? 'punto' : 'puntos'}
                            </span>
                          )}
                          <strong style={{ flex: 'none', fontSize: '13.5px', fontVariantNumeric: 'tabular-nums', color: c.color, minWidth: '38px', textAlign: 'right' }}>
                            {c.ok}%
                          </strong>
                        </div>
                        <div style={{ display: 'flex', height: '10px', width: '100%', borderRadius: '5px', overflow: 'hidden', background: '#E5E7EB' }}>
                          <div style={{ width: `${c.ok}%`, background: c.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* P05: Alternativa 2 — Sostenimiento según problemática (Ventas informales vs Parqueo indebido) + Condición física (Total / Parcial / No) */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {vocacionP05List.map(v => {
                        const safeTotal = v.total || 1;
                        const wS = (v.sostenidos / safeTotal) * 100;
                        const wA = (v.enRiesgo / safeTotal) * 100;
                        const wN = (v.recaida / safeTotal) * 100;
                        return (
                          <div
                            key={v.key}
                            style={{
                              border: '1px solid #E5E7EB',
                              borderLeft: `4px solid ${v.color}`,
                              borderRadius: '8px',
                              padding: '12px 14px',
                              background: '#F9FAFB',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                              <strong style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '13.5px', fontWeight: 700, color: '#1F2937' }}>
                                {v.label}
                              </strong>
                              <span style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '20px', fontWeight: 700, color: v.color, fontVariantNumeric: 'tabular-nums' }}>
                                {v.pctSostenimientoTxt || `${v.pctSostenimiento}%`}
                              </span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '2px', marginBottom: '8px', lineHeight: 1.35 }}>
                              {v.total} puntos verificados · {v.sostenidos + v.enRiesgo} sostenidos
                            </div>
                            {/* Barra tricolor Sostenido / En riesgo / Recaída */}
                            <div style={{ display: 'flex', height: '10px', width: '100%', borderRadius: '5px', overflow: 'hidden', background: '#E5E7EB' }}>
                              <div style={{ width: `${wS}%`, background: '#16A34A' }} title={`Sostenido: ${v.sostenidos}`} />
                              <div style={{ width: `${wA}%`, background: '#F59E0B' }} title={`En riesgo: ${v.enRiesgo}`} />
                              <div style={{ width: `${wN}%`, background: '#E3002B' }} title={`Recaída: ${v.recaida}`} />
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '7px', fontSize: '11px', color: '#4B5563', fontVariantNumeric: 'tabular-nums' }}>
                              <span className="inline-flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#16A34A' }} />
                                Sost: <strong>{v.sostenidos}</strong>
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#F59E0B' }} />
                                Riesgo: <strong>{v.enRiesgo}</strong>
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#E3002B' }} />
                                Recaída: <strong>{v.recaida}</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sub-bloque: Condición física del espacio recuperado (Total / Parcial / No) */}
                    <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '13.5px', fontWeight: 700, color: '#374151' }}>
                          Condición física del espacio recuperado (Total · Parcial · No)
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-xs inline-block" style={{ background: '#16A34A' }} />
                            Total
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-xs inline-block" style={{ background: '#F59E0B' }} />
                            Parcial
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-xs inline-block" style={{ background: '#E3002B' }} />
                            No cumple
                          </span>
                        </div>
                      </div>

                      {condicionesP05List.map(cond => (
                        <div key={cond.label} style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>{cond.label}</span>
                            <span style={{ fontSize: '12px', color: '#4B5563', fontVariantNumeric: 'tabular-nums' }}>
                              Total <strong>{cond.total}</strong> ({cond.pctTotal}%) · Parcial <strong>{cond.parcial}</strong> ({cond.pctParcial}%) · No <strong>{cond.no}</strong> ({cond.pctNo}%) —{' '}
                              <strong style={{ color: '#16A34A' }}>{cond.pctAvance}% avance</strong>
                            </span>
                          </div>
                          <div style={{ display: 'flex', height: '10px', width: '100%', borderRadius: '5px', overflow: 'hidden', background: '#E5E7EB' }}>
                            <div style={{ width: `${cond.pctTotal}%`, background: '#16A34A' }} title={`Cumplimiento total: ${cond.total} puntos (${cond.pctTotal}%)`} />
                            <div style={{ width: `${cond.pctParcial}%`, background: '#F59E0B' }} title={`Cumplimiento parcial: ${cond.parcial} puntos (${cond.pctParcial}%)`} />
                            <div style={{ width: `${cond.pctNo}%`, background: '#E3002B' }} title={`No cumple: ${cond.no} puntos (${cond.pctNo}%)`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {p.cod === 'P04' && p.riesgos.length > 0 && (
                  <div>
                    <h3 style={{ margin: '0 0 10px', fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '15px', fontWeight: 700 }}>{p.riesgoTitulo}</h3>
                    {p.riesgos.map(r => (
                      <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0' }}>
                        <span style={{ flex: '1 1 auto', minWidth: 0, fontSize: '13.5px' }}>{r.label}</span>
                        <span style={{ flex: '0 0 110px', height: '12px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                          <span style={{ display: 'block', height: '12px', width: `${r.w}%`, background: '#E3002B' }} />
                        </span>
                        <strong style={{ flex: '0 0 24px', textAlign: 'right', fontSize: '13.5px', fontVariantNumeric: 'tabular-nums' }}>{r.n}</strong>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h3 style={{ margin: '0 0 12px', fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '15px', fontWeight: 700 }}>{p.apropiacionTitulo}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {p.apropiacion.map(a => (
                      <div key={a.label} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 11px', minWidth: 0 }}>
                        <div style={{ fontSize: '10px', letterSpacing: '.07em', textTransform: 'uppercase', color: '#6B7280', fontFamily: 'Archivo, system-ui, sans-serif', fontWeight: 600, lineHeight: 1.35, minHeight: '36px' }}>
                          {a.label}
                        </div>
                        <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '21px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: '3px', color: a.color }}>
                          {a.txt}
                        </div>
                        {a.n !== undefined && (
                          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                            {a.n} {a.n === 1 ? 'punto' : 'puntos'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de puntos priorizados */}
            <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '15.5px', fontWeight: 700 }}>
                  Los {p.pri} puntos priorizados
                </h3>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#166534' }}>
                  <span style={{ background: '#16A34A', color: '#FFFFFF', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                    FÓRMULA ISP
                  </span>
                  <span>
                    <strong>70%</strong> Calificación en territorio (Sostenido 100 / En riesgo 70 / Recaída 30) + <strong>30%</strong> Criterios físicos ({p.cod === 'P04' ? '5 criterios · 6 pts c/u' : '6 criterios · 5 pts c/u'})
                  </span>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '860px', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#1F2937', color: '#FFFFFF', fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '10.5px', letterSpacing: '.07em', textTransform: 'uppercase' }}>
                      <th scope="col" style={{ textAlign: 'right', padding: '9px 8px', fontWeight: 600, width: '34px' }}>#</th>
                      <th scope="col" style={{ textAlign: 'left', padding: '9px 8px', fontWeight: 600, width: '132px' }}>Localidad</th>
                      <th scope="col" style={{ textAlign: 'center', padding: '9px 6px', fontWeight: 600, width: '40px' }}>Tr</th>
                      <th scope="col" style={{ textAlign: 'left', padding: '9px 8px', fontWeight: 600 }}>Dirección del punto</th>
                      <th scope="col" style={{ textAlign: 'left', padding: '9px 8px', fontWeight: 600, width: '144px' }}>Estado</th>
                      <th scope="col" style={{ textAlign: 'right', padding: '9px 8px', fontWeight: 600, width: '44px' }}>ISP</th>
                      <th scope="col" style={{ textAlign: 'left', padding: '9px 8px', fontWeight: 600, width: '180px' }}>Factor de riesgo</th>
                      <th scope="col" style={{ textAlign: 'center', padding: '9px 8px', fontWeight: 600, width: '140px' }}>Ficha / PDF Carta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.puntos.map(q => {
                      const isSel = selectedId === q.id;
                      return (
                        <tr
                          key={q.id}
                          onClick={() => abrirModalPunto(q.id)}
                          style={{
                            borderBottom: '1px solid #E5E7EB',
                            background: isSel ? '#FEF2F2' : q.bg,
                            cursor: 'pointer',
                          }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td style={{ textAlign: 'right', padding: '7px 8px', color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}>{q.i}</td>
                          <td style={{ padding: '7px 8px', fontWeight: 600 }}>{q.ld}</td>
                          <td style={{ textAlign: 'center', padding: '7px 6px', color: '#6B7280' }}>{q.t}</td>
                          <td style={{ padding: '7px 8px', minWidth: 0 }}>{q.d}</td>
                          <td style={{ padding: '7px 8px' }}>
                            <span style={{ display: 'inline-block', background: q.chipBg, color: q.chipFg, fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '5px', fontFamily: 'Archivo, system-ui, sans-serif' }}>
                              {q.estado}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: q.ink }}>
                            {q.ispTxt}
                          </td>
                          <td style={{ padding: '7px 8px', color: '#4B5563' }}>{q.riesgo}</td>
                          <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  abrirModalPunto(q.id);
                                }}
                                style={{
                                  fontFamily: 'Archivo, system-ui, sans-serif',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: isSel ? '#FFFFFF' : '#374151',
                                  background: isSel ? '#E3002B' : '#FFFFFF',
                                  border: `1px solid ${isSel ? '#E3002B' : '#D1D5DB'}`,
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                }}
                                title="Ver ficha técnica en pantalla"
                              >
                                Ver
                              </button>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  abrirModalPuntoYExportar(q.id);
                                }}
                                style={{
                                  fontFamily: 'Archivo, system-ui, sans-serif',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#FFFFFF',
                                  background: '#7C3AED',
                                  border: '1px solid #6D28D9',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="Descargar Ficha en PDF (Tamaño Carta)"
                              >
                                <Download style={{ width: '11px', height: '11px' }} />
                                <span>PDF</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pendientes de verificación */}
            <div style={{ padding: '20px', background: '#F9FAFB' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '15px', fontWeight: 700 }}>
                    Pendientes de verificación — {p.sv} puntos
                  </h3>
                </div>
                <span style={{ fontSize: '12.5px', color: '#6B7280', flex: 'none', fontVariantNumeric: 'tabular-nums' }}>
                  {p.svLoc} localidades con pendientes
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {p.sinVer.map(s => (
                  <div
                    key={s.ld}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderLeft: `4px solid ${s.acc}`,
                      borderRadius: '8px',
                      padding: '11px 13px',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '5px' }}>
                      <strong style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '13px', fontWeight: 700, minWidth: 0 }}>{s.ld}</strong>
                      <span style={{ fontSize: '11.5px', color: s.acc, fontWeight: 700, fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{s.n}</span>
                    </div>
                    {s.items.map((it, i) => (
                      <div key={i} style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.45, padding: '2px 0', minWidth: 0 }}>
                        <span style={{ color: '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>{it.t}</span> {it.d}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* SOSTENIBILIDAD POR LOCALIDAD */}
        <div id="localidades-sost" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '18px' }}>
          <h2 style={{ margin: '0 0 14px', fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '18px', fontWeight: 700 }}>
            Sostenibilidad por localidad
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1020px', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '10.5px', letterSpacing: '.07em', textTransform: 'uppercase', color: '#FFFFFF' }}>
                  <th scope="col" rowSpan={2} style={{ textAlign: 'left', padding: '9px 10px', fontWeight: 600, background: '#1F2937', width: '44px' }}>Cód</th>
                  <th scope="col" rowSpan={2} style={{ textAlign: 'left', padding: '9px 10px', fontWeight: 600, background: '#1F2937', width: '158px' }}>Localidad</th>
                  <th scope="col" colSpan={5} style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, background: '#1F2937', borderLeft: '3px solid #E3002B' }}>
                    P04 · Gestión de residuos
                  </th>
                  <th scope="col" colSpan={5} style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, background: '#1F2937', borderLeft: '3px solid #FFCD00' }}>
                    P05 · Espacio público
                  </th>
                </tr>
                <tr style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '10px', letterSpacing: '.05em', textTransform: 'uppercase', color: '#D1D5DB', background: '#374151' }}>
                  <th scope="col" style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, width: '54px', borderLeft: '3px solid #E3002B' }}>Puntos</th>
                  <th scope="col" style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, width: '50px' }}>Sost.</th>
                  <th scope="col" style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, width: '62px' }}>No sost.</th>
                  <th scope="col" style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, width: '52px' }}>Sin ver.</th>
                  <th scope="col" style={{ textAlign: 'left', padding: '7px 8px', fontWeight: 600, width: '96px' }}>Reparto</th>
                  <th scope="col" style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, width: '54px', borderLeft: '3px solid #FFCD00' }}>Puntos</th>
                  <th scope="col" style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, width: '50px' }}>Sost.</th>
                  <th scope="col" style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, width: '62px' }}>No sost.</th>
                  <th scope="col" style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, width: '52px' }}>Sin ver.</th>
                  <th scope="col" style={{ textAlign: 'left', padding: '7px 8px', fontWeight: 600, width: '96px' }}>Reparto</th>
                </tr>
              </thead>
              <tbody>
                {matriz.map(m => (
                  <tr key={m.cod} style={{ borderBottom: '1px solid #E5E7EB', background: m.rowBg }}>
                    <td style={{ padding: '8px 10px', color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}>{m.cod}</td>
                    <th scope="row" style={{ textAlign: 'left', padding: '8px 10px', fontWeight: m.fw }}>{m.ld}</th>
                    <td style={{ textAlign: 'right', padding: '8px', fontVariantNumeric: 'tabular-nums', fontWeight: 600, borderLeft: '3px solid #E3002B' }}>{m.p4.pri}</td>
                    <td style={{ textAlign: 'right', padding: '8px', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: m.p4.sC }}>{m.p4.sost}</td>
                    <td style={{ textAlign: 'right', padding: '8px', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: m.p4.nC }}>{m.p4.noSost}</td>
                    <td style={{ textAlign: 'right', padding: '8px', fontVariantNumeric: 'tabular-nums', color: '#6B7280' }}>{m.p4.sv}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ display: 'flex', height: '11px', borderRadius: '4px', overflow: 'hidden', background: '#F3F4F6' }}>
                        <span style={{ width: `${m.p4.wS}%`, background: '#16A34A' }} />
                        <span style={{ width: `${m.p4.wN}%`, background: '#E3002B' }} />
                        <span style={{ width: `${m.p4.wV}%`, background: '#D1D5DB' }} />
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px', fontVariantNumeric: 'tabular-nums', fontWeight: 600, borderLeft: '3px solid #FFCD00' }}>{m.p5.pri}</td>
                    <td style={{ textAlign: 'right', padding: '8px', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: m.p5.sC }}>{m.p5.sost}</td>
                    <td style={{ textAlign: 'right', padding: '8px', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: m.p5.nC }}>{m.p5.noSost}</td>
                    <td style={{ textAlign: 'right', padding: '8px', fontVariantNumeric: 'tabular-nums', color: '#6B7280' }}>{m.p5.sv}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ display: 'flex', height: '11px', borderRadius: '4px', overflow: 'hidden', background: '#F3F4F6' }}>
                        <span style={{ width: `${m.p5.wS}%`, background: '#16A34A' }} />
                        <span style={{ width: `${m.p5.wN}%`, background: '#E3002B' }} />
                        <span style={{ width: `${m.p5.wV}%`, background: '#D1D5DB' }} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#F3F4F6', fontFamily: 'Archivo, system-ui, sans-serif', fontWeight: 700 }}>
                  <td style={{ padding: '10px' }} />
                  <th scope="row" style={{ textAlign: 'left', padding: '10px' }}>Total</th>
                  <td style={{ textAlign: 'right', padding: '10px 8px', fontVariantNumeric: 'tabular-nums', borderLeft: '3px solid #E3002B' }}>{r4.pri}</td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', fontVariantNumeric: 'tabular-nums', color: '#16A34A' }}>{r4.sost}</td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', fontVariantNumeric: 'tabular-nums', color: '#E3002B' }}>{r4.n}</td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', fontVariantNumeric: 'tabular-nums', color: '#6B7280' }}>{r4.v}</td>
                  <td style={{ padding: '10px 8px' }} />
                  <td style={{ textAlign: 'right', padding: '10px 8px', fontVariantNumeric: 'tabular-nums', borderLeft: '3px solid #FFCD00' }}>{r5.pri}</td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', fontVariantNumeric: 'tabular-nums', color: '#16A34A' }}>{r5.sost}</td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', fontVariantNumeric: 'tabular-nums', color: '#E3002B' }}>{r5.n}</td>
                  <td style={{ textAlign: 'right', padding: '10px 8px', fontVariantNumeric: 'tabular-nums', color: '#6B7280' }}>{r5.v}</td>
                  <td style={{ padding: '10px 8px' }} />
                </tr>
              </tfoot>
            </table>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px 20px', fontSize: '12.5px', color: '#4B5563' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ width: '12px', height: '12px', background: '#16A34A', borderRadius: '3px' }} />
              Sostenidos (sostenido + en riesgo)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ width: '12px', height: '12px', background: '#E3002B', borderRadius: '3px' }} />
              No sostenidos
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ width: '12px', height: '12px', background: '#D1D5DB', borderRadius: '3px' }} />
              Sin verificación
            </span>
          </div>
        </div>

        {/* MÉTODO */}
        <div id="metodo-sost" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', borderTop: '4px solid #1F2937', padding: '18px', minWidth: 0 }}>
          <h2 style={{ margin: '0 0 14px', fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '17px', fontWeight: 700 }}>
            Criterios de cálculo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REGLAS_OFICIALES.map(r => (
              <div key={r.titulo} style={{ padding: '12px 14px', border: '1px solid #F3F4F6', borderRadius: '8px', background: '#F9FAFB' }}>
                <strong style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '13.5px', display: 'block', marginBottom: '4px', color: '#1F2937' }}>
                  {r.titulo}
                </strong>
                <span style={{ fontSize: '12.5px', color: '#374151', lineHeight: 1.5 }}>{r.texto}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie de página */}
        <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }} className="flex flex-wrap items-center justify-between gap-2">
          <div style={{ fontWeight: 600 }}>
            SDG Unidad de Transformación - Subsecretaría de Gestión Local Grupo de Espacio Público
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Actualizado por: {snapshot.ejecutadoPor || userData?.nombre || 'Sistema RADAR'}</span>
          </div>
        </div>
      </div>

      {/* VENTANA MODAL DE FICHA DE PUNTO (AL DAR CLIC EN CUALQUIER PUNTO) */}
      {sel && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs"
          onClick={cerrarModalPunto}
        >
          <style>{`
            @page {
              size: letter portrait;
              margin: 8mm;
            }
            @media print {
              body * {
                visibility: hidden !important;
              }
              #ficha-imprimible-carta, #ficha-imprimible-carta * {
                visibility: visible !important;
              }
              #ficha-imprimible-carta {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 14px !important;
                background: #ffffff !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-imprimir {
                display: none !important;
              }
            }
          `}</style>
          <div
            className="bg-white rounded-xl max-w-5xl w-full shadow-2xl border border-gray-200 overflow-hidden my-8 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Cabecera coloreada de la Ficha */}
            <div
              style={{
                background: sel.chipBg,
                color: sel.chipFg,
                padding: '16px 24px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '14px',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              <div style={{ minWidth: 0, flex: '1 1 300px' }}>
                <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '10.5px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
                  Ficha de punto · {sel.estado}
                </div>
                <h2 style={{ margin: '4px 0 0', fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}>
                  {sel.d}
                </h2>
              </div>

              <div className="flex items-center gap-5 flex-wrap">
                <div>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.8 }}>ISP</div>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '28px', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{sel.ispTxt}</div>
                  <div style={{ fontSize: '9px', opacity: 0.85, marginTop: '3px', fontFamily: 'Archivo, system-ui, sans-serif' }}>70% campo · 30% criterios</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.8 }}>Producto</div>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '17px', fontWeight: 700, lineHeight: 1.5 }}>{sel.prod}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.8 }}>Localidad</div>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '17px', fontWeight: 700, lineHeight: 1.5 }}>{sel.ld}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.8 }}>Trimestre</div>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '17px', fontWeight: 700, lineHeight: 1.5 }}>{sel.t}</div>
                </div>
                <div className="flex items-center gap-2 no-imprimir">
                  <button
                    type="button"
                    onClick={exportarFichaPdfCarta}
                    disabled={generandoPdf}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-900 hover:bg-gray-100 shadow-xs transition-colors cursor-pointer border border-gray-300"
                    title="Exportar ficha técnica a PDF en tamaño carta"
                  >
                    {generandoPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-700" /> : <Download className="w-3.5 h-3.5 text-purple-700" />}
                    <span>{generandoPdf ? 'Generando...' : 'Exportar PDF (Carta)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={imprimirFichaCarta}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-900 hover:bg-gray-100 shadow-xs transition-colors cursor-pointer border border-gray-300"
                    title="Imprimir ficha técnica en tamaño carta"
                  >
                    <Printer className="w-3.5 h-3.5 text-gray-700" />
                    <span>Imprimir</span>
                  </button>
                  <button
                    type="button"
                    onClick={cerrarModalPunto}
                    className="p-2 rounded-lg bg-white/80 hover:bg-white text-gray-800 shadow-xs transition-colors cursor-pointer"
                    title="Cerrar ficha"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Contenedor Imprimible y Exportable a PDF Tamaño Carta */}
            <div id="ficha-imprimible-carta" className="p-6 overflow-y-auto space-y-5 bg-white text-gray-900">
              {/* Encabezado Institucional Oficial Alcaldía de Bogotá */}
              <div className="border-b-2 border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-12 bg-gradient-to-b from-red-600 via-yellow-400 to-blue-800 rounded-full" />
                  <div>
                    <div className="text-[12px] font-black tracking-wide text-gray-900 uppercase">
                      Alcaldía Mayor de Bogotá · Secretaría Distrital de Gobierno
                    </div>
                    <div className="text-xs font-bold text-gray-700">
                      SDG Unidad de Transformación - Subsecretaría de Gestión Local Grupo de Espacio Público
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Sistema de Monitoreo y Seguimiento Territorial de Sostenibilidad · Vigencia 2026
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 uppercase tracking-wider mb-1">
                    Ficha Técnica · Tamaño Carta
                  </div>
                  <div className="text-[11px] text-gray-600 font-mono">
                    ID Registro: {sel.id} · {sel.ld}
                  </div>
                </div>
              </div>

              {/* Banner de Identificación y Diagnóstico del Punto */}
              <div
                style={{
                  background: sel.chipBg,
                  color: sel.chipFg,
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '14px',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ minWidth: 0, flex: '1 1 300px' }}>
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-85">
                    {sel.prod === 'P04' ? 'P04 · Gestión de Residuos' : 'P05 · Espacio Público'} · {sel.t}
                  </div>
                  <h3 className="text-lg font-bold m-0 leading-tight">
                    {sel.d}
                  </h3>
                  <div className="text-xs opacity-90 mt-1 font-semibold">
                    Localidad: {sel.ld} · Estado: {sel.estado}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-center px-3 py-1 bg-white/40 rounded-lg">
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-85">ISP Total</div>
                    <div className="text-2xl font-black font-mono leading-none">{sel.ispTxt}</div>
                    <div className="text-[9px] opacity-80 mt-0.5">70% campo + 30% crit.</div>
                  </div>
                  <div className="text-center px-3 py-1 bg-white/40 rounded-lg">
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-85">Riesgo</div>
                    <div className="text-xs font-bold leading-tight max-w-[130px] truncate">{sel.riesgo}</div>
                  </div>
                  <div className="text-center px-3 py-1 bg-white/40 rounded-lg">
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-85">¿Nueva interv.?</div>
                    <div className="text-xs font-black">{sel.cls === 'N' ? 'SÍ' : 'NO'}</div>
                  </div>
                </div>
              </div>

              {/* Grilla técnica: 3 Columnas debidamente distribuidas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Columna 1: Datos de visita y estado general */}
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 mb-2 border-b border-gray-300">
                      1 · Datos de la Visita
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-200">
                        <span className="text-gray-500">Fecha y hora:</span>
                        <strong className="font-semibold text-gray-900">{sel.fecha}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-200">
                        <span className="text-gray-500">Reporta:</span>
                        <strong className="font-semibold text-gray-900">{esV ? '—' : sel.reporta || 'Profesional Equipo EP'}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-200">
                        <span className="text-gray-500">Dependencia:</span>
                        <strong className="font-semibold text-gray-900 text-right truncate max-w-[180px]" title={sel.dependencia}>
                          SDG - Gestión Local
                        </strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-200">
                        <span className="text-gray-500">Producto:</span>
                        <strong className="font-semibold text-gray-900">{sel.prod === 'P04' ? 'P04 · Residuos' : 'P05 · Espacio Público'}</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500">Trimestre:</span>
                        <strong className="font-semibold text-gray-900">{sel.t}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 mb-2 border-b border-gray-300">
                      2 · Evaluación del Modelo
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Estado observado:</span>
                        <span style={{ background: sel.chipBg, color: sel.chipFg }} className="px-2 py-0.5 rounded text-[11px] font-bold">
                          {sel.estado}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Aporte al ISP:</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${esV ? 'bg-gray-200 text-gray-700' : sel.cls === 'N' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {esV ? 'Sin clasificar' : sel.cls === 'N' ? 'No sostenido' : 'Sostenido'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Factor de riesgo:</span>
                        <strong className="font-semibold text-gray-800 text-right">{sel.riesgo}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna 2: Criterios y Diagnóstico */}
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 mb-2 border-b border-yellow-400">
                      3 · {sel.prod === 'P04' ? 'Condición Física del Punto' : 'Condición del Espacio Recuperado'}
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {criteriosFicha.map(c => (
                        <div key={c.k} className="flex items-center justify-between gap-2 py-1 border-b border-gray-200">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              style={{ background: c.bg }}
                              className="w-4 h-4 rounded text-white text-[10px] font-bold inline-flex items-center justify-center shrink-0"
                            >
                              {c.mark}
                            </span>
                            <span className="truncate text-gray-700">{c.k}</span>
                          </div>
                          <strong style={{ color: c.bg }} className="font-bold shrink-0">{c.v}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 mb-2 border-b border-yellow-400">
                      4 · Diagnóstico y Recomendación
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Lo observado en territorio</div>
                        <p className="text-xs text-gray-800 m-0 mt-0.5 leading-relaxed">
                          {sel.descripcion || DESC[sel.cls] || DESC.V}
                        </p>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Recomendación a la Alcaldía Local</div>
                        <p className="text-xs text-gray-800 m-0 mt-0.5 leading-relaxed">
                          {sel.recomendacion || RECO[sel.cls] || RECO.V}
                        </p>
                      </div>
                      <div className="pt-1">
                        <span style={{ background: sel.chipBg, color: sel.chipFg }} className="inline-block px-2.5 py-1 rounded text-[11px] font-bold">
                          {ACC[sel.cls] || ACC.V}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna 3: Registro Fotográfico de Evidencia */}
                <div className="space-y-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 mb-2 border-b border-red-500">
                      5 · Registro Fotográfico de Evidencias
                    </h4>

                    {!esV && evidenciasFicha.length > 0 ? (
                      <div className="space-y-3">
                        {/* Galería imprimible / visor: muestra las fotos lado a lado */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {evidenciasFicha.map((e, idx) => {
                            const isVid =
                              e.contentType?.startsWith('video') ||
                              e.file.toLowerCase().endsWith('.mov') ||
                              e.file.toLowerCase().endsWith('.mp4');
                            return (
                              <div key={idx} className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                                {!isVid && e.url ? (
                                  <img
                                    crossOrigin="anonymous"
                                    src={`${API}/api/sostenibilidad/attachment?url=${encodeURIComponent(e.url)}`}
                                    alt={e.label}
                                    className="w-full h-32 object-cover bg-gray-100"
                                    loading="lazy"
                                  />
                                ) : isVid ? (
                                  <div className="w-full h-32 bg-slate-900 flex flex-col items-center justify-center p-3 text-center text-white">
                                    <Video className="w-6 h-6 text-yellow-400 mb-1" />
                                    <span className="text-[10px] text-gray-300 truncate max-w-full">{e.file}</span>
                                  </div>
                                ) : (
                                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">
                                    <Camera className="w-6 h-6" />
                                  </div>
                                )}
                                <div className="px-2 py-1 bg-gray-100 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-700">
                                  <span className="truncate font-semibold">{e.label}</span>
                                  {e.url && (
                                    <a
                                      href={`${API}/api/sostenibilidad/attachment?url=${encodeURIComponent(e.url)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-bogota-primary hover:underline ml-1 shrink-0 no-imprimir"
                                    >
                                      Ver
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 text-xs">
                        Este punto no tiene visita registrada en el periodo, por lo que no se registran evidencias fotográficas disponibles.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pie Institucional Oficial */}
              <div className="pt-3 border-t border-gray-300 flex flex-wrap items-center justify-between text-xs text-gray-600 gap-2">
                <span className="font-semibold text-gray-800">
                  SDG Unidad de Transformación - Subsecretaría de Gestión Local Grupo de Espacio Público
                </span>
                <span className="text-[11px] text-gray-500">
                  Documento Oficial de Monitoreo Distrital · Bogotá D.C.
                </span>
              </div>
            </div>

            {/* Pie de la ventana modal */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-gray-500">
                Punto #{sel.i} de {sel.prod} · {sel.ld} ({sel.t}) · SDG Unidad de Transformación - Subsecretaría de Gestión Local Grupo de Espacio Público
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportarFichaPdfCarta}
                  disabled={generandoPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 transition-colors cursor-pointer shadow-xs"
                >
                  {generandoPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{generandoPdf ? 'Generando...' : 'Exportar PDF (Carta)'}</span>
                </button>
                <button
                  type="button"
                  onClick={imprimirFichaCarta}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-700" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={cerrarModalPunto}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gray-800 text-white hover:bg-black transition-colors cursor-pointer"
                >
                  Cerrar ventana
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ventana Modal para Punto en Confirmación UAESP — Acción Focalizada Octubre (21 puntos) */}
      {selFocalizado && <ModalPuntoFocalizadoOct punto={selFocalizado} onClose={cerrarModalFocalizado} />}

      {/* Modal de configuración de conexión ArcGIS Survey123 */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Conexión ArcGIS Survey123</h3>
                <p className="text-xs text-gray-500">Formulario ID: 6ad0fc8ddc574571bcb6252a49ebab4d</p>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Usuario ArcGIS</label>
                <input
                  type="text"
                  value={arcgisUser}
                  onChange={e => setArcgisUser(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-bogota-primary"
                  placeholder="profesionalOEP"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Contraseña ArcGIS <span className="text-gray-400 font-normal">(dejar vacío para usar la configurada en el servidor)</span>
                </label>
                <input
                  type="password"
                  value={arcgisPass}
                  onChange={e => setArcgisPass(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-bogota-primary"
                  placeholder="••••••••••"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Token o `esriJSAPISession` <span className="text-gray-400 font-normal">(para descargar fotos y videos reales de tu sesión abierta)</span>
                </label>
                <input
                  type="text"
                  value={arcgisToken}
                  onChange={e => setArcgisToken(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 font-mono text-[11px] focus:outline-none focus:border-bogota-primary"
                  placeholder="Pega aquí el token o valor de esriJSAPISession..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfigModal(false);
                  ejecutarActualizacion('MANUAL', {
                    username: arcgisUser,
                    password: arcgisPass || undefined,
                    token: arcgisToken || undefined,
                  });
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-bogota-primary hover:bg-red-700"
              >
                Guardar y sincronizar ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Exportar Informe Consolidado (Residuos, Espacio Público o Ambos) */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-gray-200 overflow-hidden my-4 max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white px-6 py-4 flex flex-wrap gap-4 items-center justify-between border-b border-purple-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <FileText className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white leading-tight">Exportar Informe Consolidado</h3>
                  <p className="text-xs text-purple-200">Genera y descarga en PDF tamaño carta el balance distrital completo</p>
                </div>
              </div>

                            {/* Botones de acción superiores */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportarConsolidadoPdfCarta}
                  disabled={generandoConsolidadoPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-purple-950 bg-white hover:bg-purple-50 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {generandoConsolidadoPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-700" /> : <Download className="w-3.5 h-3.5 text-purple-700" />}
                  <span>{generandoConsolidadoPdf ? 'Generando PDF...' : 'Descargar PDF (Carta)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Selector de Pestañas: Todo Residuos | Todo Espacio Público | Ambos */}
            <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Alcance del informe:</span>
                <button
                  type="button"
                  onClick={() => setExportTab('P04')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    exportTab === 'P04'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  🗑 P04 · Todo Residuos ({p04Full.length} puntos)
                </button>
                <button
                  type="button"
                  onClick={() => setExportTab('P05')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    exportTab === 'P05'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  🚶 P05 · Todo Espacio Público ({p05Full.length} puntos)
                </button>
                <button
                  type="button"
                  onClick={() => setExportTab('AMBOS')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    exportTab === 'AMBOS'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  🏛 Ambos · Consolidado Distrital ({p04Full.length + p05Full.length} puntos)
                </button>
              </div>
              <div className="text-xs text-gray-500 hidden sm:block">
                Paginación automática en hojas <strong>Tamaño Carta (215.9 x 279.4 mm)</strong>
              </div>
            </div>

            {/* Vista previa con Hojas Tamaño Carta individuales para evitar cortes */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/80 flex flex-col items-center gap-6">
              
              {/* VISTA P04: TODO RESIDUOS (3 HOJAS CARTA) */}
              {exportTab === 'P04' && (
                <>
                  {/* HOJA 1 DE 3 */}
                  <div
                    className="hoja-carta-exportable bg-white shadow-xl rounded-sm text-gray-900 flex flex-col justify-between"
                    style={{
                      width: '215.9mm',
                      minHeight: '279.4mm',
                      maxHeight: '279.4mm',
                      padding: '11mm 13mm',
                      boxSizing: 'border-box',
                      fontFamily: '"Source Sans 3", "Segoe UI", system-ui, sans-serif',
                      overflow: 'hidden'
                    }}
                  >
                    <div>
                      {/* Encabezado Hoja 1 */}
                      <div className="border-b-2 border-red-600 pb-2 mb-3 flex justify-between items-start">
                        <div>
                          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                            Alcaldía Mayor de Bogotá D.C. · Secretaría Distrital de Gobierno
                          </div>
                          <div className="text-[9px] font-semibold text-gray-500">
                            Subsecretaría de Gestión Local · Grupo de Espacio Público · RADAR
                          </div>
                          <h1 className="text-base font-bold text-gray-900 mt-0.5 uppercase" style={{ fontFamily: 'Archivo, system-ui, sans-serif' }}>
                            Informe Consolidado · P04 Gestión de Residuos
                          </h1>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="inline-block bg-purple-50 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">
                            Fecha de Corte: 15 de Octubre de 2026
                          </div>
                          <div className="text-[9px] text-gray-400 mt-0.5">
                            Periodo de visita: {datos.periodoVisita} · Sync: {formatearFechaLectura(snapshot.ultimaLectura)}
                          </div>
                        </div>
                      </div>

                      {/* Tarjetas KPI dinámicas */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
                          <div className="text-[10px] text-gray-500 font-medium">Puntos Priorizados</div>
                          <div className="text-lg font-bold text-gray-900">{r4Full.pri}</div>
                          <div className="text-[9px] text-gray-400">100% Universo P04</div>
                        </div>
                        <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                          <div className="text-[10px] text-green-700 font-medium">% Sostenimiento</div>
                          <div className="text-lg font-bold text-green-700">{r4Full.pctTxt}%</div>
                          <div className="text-[9px] text-green-600">{r4Full.sost} sostenidos / en riesgo</div>
                        </div>
                        <div className="bg-red-50 p-2 rounded border border-red-200 text-center">
                          <div className="text-[10px] text-red-700 font-medium">Recaída Confirmada</div>
                          <div className="text-lg font-bold text-red-700">{r4Full.n}</div>
                          <div className="text-[9px] text-red-600">{((r4Full.n / r4Full.pri) * 100).toFixed(1).replace('.', ',')}% del universo</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded border border-blue-200 text-center">
                          <div className="text-[10px] text-blue-700 font-medium">Cobertura Visitas</div>
                          <div className="text-lg font-bold text-blue-700">{r4Full.ver} de {r4Full.pri}</div>
                          <div className="text-[9px] text-blue-600">{r4Full.v} sin verificar</div>
                        </div>
                      </div>

                      {/* Tabla Chunk 1: Puntos 1 a 18 */}
                      <div className="text-[11px] font-bold text-gray-800 uppercase mb-1.5 flex justify-between">
                        <span>Puntos Priorizados de Residuos (1 a 18 de {p04Full.length})</span>
                        <span className="text-gray-400 font-normal text-[10px]">Sostenido = S + A · Recaída = N</span>
                      </div>
                      <table className="w-full text-left text-[9.5px] border-collapse border border-gray-200">
                        <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                          <tr>
                            <th className="py-1 px-1.5 w-6 text-center border-r border-gray-200">#</th>
                            <th className="py-1 px-1.5 w-24 border-r border-gray-200">Localidad</th>
                            <th className="py-1 px-1.5 border-r border-gray-200">Dirección del Punto</th>
                            <th className="py-1 px-1.5 w-24 text-center border-r border-gray-200">Clasificación</th>
                            <th className="py-1 px-1.5 w-10 text-center border-r border-gray-200">ISP</th>
                            <th className="py-1 px-1.5 w-36">Principal Factor Riesgo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {p04Full.slice(0, 18).map((p, idx) => (
                            <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                              <td className="py-1 px-1.5 text-center font-mono text-gray-400 border-r border-gray-100">{idx + 1}</td>
                              <td className="py-1 px-1.5 font-semibold text-gray-800 border-r border-gray-100">{p.ld}</td>
                              <td className="py-1 px-1.5 text-gray-900 border-r border-gray-100">{p.d}</td>
                              <td className="py-1 px-1.5 text-center border-r border-gray-100">
                                <span className="inline-block px-1.5 py-0.2 rounded-full text-[8.5px] font-bold" style={{ background: p.chipBg, color: p.chipFg }}>
                                  {p.estado}
                                </span>
                              </td>
                              <td className="py-1 px-1.5 text-center font-mono font-bold text-gray-700 border-r border-gray-100">{p.ispTxt}</td>
                              <td className="py-1 px-1.5 text-gray-600 truncate max-w-[140px]">{p.riesgo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="border-t border-gray-200 pt-1.5 flex justify-between items-center text-[9px] text-gray-500">
                      <span>Alcaldía Mayor de Bogotá D.C. · Secretaría Distrital de Gobierno · Subsecretaría de Gestión Local</span>
                      <span>Página 1 de 3 · Formato Carta</span>
                    </div>
                  </div>

                  {/* HOJA 2 DE 3 */}
                  <div
                    className="hoja-carta-exportable bg-white shadow-xl rounded-sm text-gray-900 flex flex-col justify-between"
                    style={{
                      width: '215.9mm',
                      minHeight: '279.4mm',
                      maxHeight: '279.4mm',
                      padding: '11mm 13mm',
                      boxSizing: 'border-box',
                      fontFamily: '"Source Sans 3", "Segoe UI", system-ui, sans-serif',
                      overflow: 'hidden'
                    }}
                  >
                    <div>
                      {/* Encabezado Hoja 2 */}
                      <div className="border-b border-gray-200 pb-1.5 mb-3 flex justify-between items-center">
                        <div className="text-[10px] font-bold text-gray-700 uppercase">
                          P04 Gestión de Residuos · Puntos Priorizados (19 a 42 de {p04Full.length})
                        </div>
                        <div className="text-[9px] text-gray-400">
                          Corte: 15 Octubre 2026 · Sostenimiento Distrital P04: <strong>{r4Full.pctTxt}%</strong>
                        </div>
                      </div>

                      <table className="w-full text-left text-[9.5px] border-collapse border border-gray-200">
                        <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                          <tr>
                            <th className="py-1 px-1.5 w-6 text-center border-r border-gray-200">#</th>
                            <th className="py-1 px-1.5 w-24 border-r border-gray-200">Localidad</th>
                            <th className="py-1 px-1.5 border-r border-gray-200">Dirección del Punto</th>
                            <th className="py-1 px-1.5 w-24 text-center border-r border-gray-200">Clasificación</th>
                            <th className="py-1 px-1.5 w-10 text-center border-r border-gray-200">ISP</th>
                            <th className="py-1 px-1.5 w-36">Principal Factor Riesgo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {p04Full.slice(18, 42).map((p, idx) => (
                            <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                              <td className="py-1 px-1.5 text-center font-mono text-gray-400 border-r border-gray-100">{idx + 19}</td>
                              <td className="py-1 px-1.5 font-semibold text-gray-800 border-r border-gray-100">{p.ld}</td>
                              <td className="py-1 px-1.5 text-gray-900 border-r border-gray-100">{p.d}</td>
                              <td className="py-1 px-1.5 text-center border-r border-gray-100">
                                <span className="inline-block px-1.5 py-0.2 rounded-full text-[8.5px] font-bold" style={{ background: p.chipBg, color: p.chipFg }}>
                                  {p.estado}
                                </span>
                              </td>
                              <td className="py-1 px-1.5 text-center font-mono font-bold text-gray-700 border-r border-gray-100">{p.ispTxt}</td>
                              <td className="py-1 px-1.5 text-gray-600 truncate max-w-[140px]">{p.riesgo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="border-t border-gray-200 pt-1.5 flex justify-between items-center text-[9px] text-gray-500">
                      <span>Alcaldía Mayor de Bogotá D.C. · Secretaría Distrital de Gobierno · Subsecretaría de Gestión Local</span>
                      <span>Página 2 de 3 · Formato Carta</span>
                    </div>
                  </div>

                  {/* HOJA 3 DE 3 */}
                  <div
                    className="hoja-carta-exportable bg-white shadow-xl rounded-sm text-gray-900 flex flex-col justify-between"
                    style={{
                      width: '215.9mm',
                      minHeight: '279.4mm',
                      maxHeight: '279.4mm',
                      padding: '11mm 13mm',
                      boxSizing: 'border-box',
                      fontFamily: '"Source Sans 3", "Segoe UI", system-ui, sans-serif',
                      overflow: 'hidden'
                    }}
                  >
                    <div>
                      {/* Encabezado Hoja 3 */}
                      <div className="border-b border-gray-200 pb-1.5 mb-3 flex justify-between items-center">
                        <div className="text-[10px] font-bold text-gray-700 uppercase">
                          P04 Gestión de Residuos · Puntos Priorizados (43 a 60 de {p04Full.length}) y Factores
                        </div>
                        <div className="text-[9px] text-gray-400">
                          Corte: 15 Octubre 2026 · Cierre de Evaluación
                        </div>
                      </div>

                      {/* Tabla Chunk 3 */}
                      <table className="w-full text-left text-[9.5px] border-collapse border border-gray-200 mb-4">
                        <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                          <tr>
                            <th className="py-1 px-1.5 w-6 text-center border-r border-gray-200">#</th>
                            <th className="py-1 px-1.5 w-24 border-r border-gray-200">Localidad</th>
                            <th className="py-1 px-1.5 border-r border-gray-200">Dirección del Punto</th>
                            <th className="py-1 px-1.5 w-24 text-center border-r border-gray-200">Clasificación</th>
                            <th className="py-1 px-1.5 w-10 text-center border-r border-gray-200">ISP</th>
                            <th className="py-1 px-1.5 w-36">Principal Factor Riesgo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {p04Full.slice(42, 60).map((p, idx) => (
                            <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                              <td className="py-1 px-1.5 text-center font-mono text-gray-400 border-r border-gray-100">{idx + 43}</td>
                              <td className="py-1 px-1.5 font-semibold text-gray-800 border-r border-gray-100">{p.ld}</td>
                              <td className="py-1 px-1.5 text-gray-900 border-r border-gray-100">{p.d}</td>
                              <td className="py-1 px-1.5 text-center border-r border-gray-100">
                                <span className="inline-block px-1.5 py-0.2 rounded-full text-[8.5px] font-bold" style={{ background: p.chipBg, color: p.chipFg }}>
                                  {p.estado}
                                </span>
                              </td>
                              <td className="py-1 px-1.5 text-center font-mono font-bold text-gray-700 border-r border-gray-100">{p.ispTxt}</td>
                              <td className="py-1 px-1.5 text-gray-600 truncate max-w-[140px]">{p.riesgo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Análisis de Factores de Riesgo y Criterios */}
                      <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div>
                          <div className="text-[10px] font-bold text-gray-800 uppercase mb-1.5">
                            Factores de Riesgo Identificados (Residuos)
                          </div>
                          <div className="space-y-1">
                            {datos.riesgosP04 && datos.riesgosP04.slice(0, 4).map((r: any) => (
                              <div key={r.label} className="flex justify-between items-center text-[9px]">
                                <span className="text-gray-600">{r.label}</span>
                                <span className="font-bold text-gray-900 font-mono">{r.n} puntos</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-gray-800 uppercase mb-1.5">
                            Criterios de Limpieza y Disposición
                          </div>
                          <div className="space-y-1 text-[9px] text-gray-600">
                            <div>• Libre de residuos acumulados y sin disposición de RCD.</div>
                            <div>• Limpieza aceptable y sin dispersión de bolsas o regueros.</div>
                            <div>• Apropiación vecinal y corresponsabilidad ciudadana activa.</div>
                            <div>• Sostenimiento consolidado distrital: <strong className="text-green-700">{r4Full.pctTxt}%</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-1.5 flex justify-between items-center text-[9px] text-gray-500">
                      <span>Alcaldía Mayor de Bogotá D.C. · Secretaría Distrital de Gobierno · Subsecretaría de Gestión Local</span>
                      <span>Página 3 de 3 · Formato Carta</span>
                    </div>
                  </div>
                </>
              )}

              {/* VISTA P05: TODO ESPACIO PÚBLICO (3 HOJAS CARTA) */}
              {exportTab === 'P05' && (
                <>
                  {/* HOJA 1 DE 3 */}
                  <div
                    className="hoja-carta-exportable bg-white shadow-xl rounded-sm text-gray-900 flex flex-col justify-between"
                    style={{
                      width: '215.9mm',
                      minHeight: '279.4mm',
                      maxHeight: '279.4mm',
                      padding: '11mm 13mm',
                      boxSizing: 'border-box',
                      fontFamily: '"Source Sans 3", "Segoe UI", system-ui, sans-serif',
                      overflow: 'hidden'
                    }}
                  >
                    <div>
                      {/* Encabezado Hoja 1 */}
                      <div className="border-b-2 border-red-600 pb-2 mb-3 flex justify-between items-start">
                        <div>
                          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                            Alcaldía Mayor de Bogotá D.C. · Secretaría Distrital de Gobierno
                          </div>
                          <div className="text-[9px] font-semibold text-gray-500">
                            Subsecretaría de Gestión Local · Grupo de Espacio Público · RADAR
                          </div>
                          <h1 className="text-base font-bold text-gray-900 mt-0.5 uppercase" style={{ fontFamily: 'Archivo, system-ui, sans-serif' }}>
                            Informe Consolidado · P05 Recuperación de Espacio Público
                          </h1>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="inline-block bg-purple-50 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">
                            Fecha de Corte: 15 de Octubre de 2026
                          </div>
                          <div className="text-[9px] text-gray-400 mt-0.5">
                            Periodo de visita: {datos.periodoVisita} · Sync: {formatearFechaLectura(snapshot.ultimaLectura)}
                          </div>
                        </div>
                      </div>

                      {/* Tarjetas KPI dinámicas */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
                          <div className="text-[10px] text-gray-500 font-medium">Puntos Priorizados</div>
                          <div className="text-lg font-bold text-gray-900">{r5Full.pri}</div>
                          <div className="text-[9px] text-gray-400">100% Universo P05</div>
                        </div>
                        <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                          <div className="text-[10px] text-green-700 font-medium">% Sostenimiento</div>
                          <div className="text-lg font-bold text-green-700">{r5Full.pctTxt}%</div>
                          <div className="text-[9px] text-green-600">{r5Full.sost} sostenidos / en riesgo</div>
                        </div>
                        <div className="bg-red-50 p-2 rounded border border-red-200 text-center">
                          <div className="text-[10px] text-red-700 font-medium">Recaída Confirmada</div>
                          <div className="text-lg font-bold text-red-700">{r5Full.n}</div>
                          <div className="text-[9px] text-red-600">{((r5Full.n / r5Full.pri) * 100).toFixed(1).replace('.', ',')}% del universo</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded border border-blue-200 text-center">
                          <div className="text-[10px] text-blue-700 font-medium">Cobertura Visitas</div>
                          <div className="text-lg font-bold text-blue-700">{r5Full.ver} de {r5Full.pri}</div>
                          <div className="text-[9px] text-blue-600">{r5Full.v} sin verificar</div>
                        </div>
                      </div>

                      {/* Desglose de Vocación */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-amber-50/70 p-2 rounded border border-amber-200">
                          <div className="text-[10px] font-bold text-amber-900 mb-0.5">Ventas Informales</div>
                          <div className="text-xs font-semibold text-amber-800">
                            {vocacionP05List[0]?.total || 0} puntos · {vocacionP05List[0]?.pctSostenimientoTxt || '—'} sostenimiento
                          </div>
                          <div className="text-[9px] text-amber-700 mt-0.5">
                            {vocacionP05List[0]?.sostenidos + vocacionP05List[0]?.enRiesgo} sostenidos · {vocacionP05List[0]?.recaida} recaídas
                          </div>
                        </div>
                        <div className="bg-blue-50/70 p-2 rounded border border-blue-200">
                          <div className="text-[10px] font-bold text-blue-900 mb-0.5">Parqueo Indebido</div>
                          <div className="text-xs font-semibold text-blue-800">
                            {vocacionP05List[1]?.total || 0} puntos · {vocacionP05List[1]?.pctSostenimientoTxt || '—'} sostenimiento
                          </div>
                          <div className="text-[9px] text-blue-700 mt-0.5">
                            {vocacionP05List[1]?.sostenidos + vocacionP05List[1]?.enRiesgo} sostenidos · {vocacionP05List[1]?.recaida} recaídas
                          </div>
                        </div>
                      </div>

                      {/* Tabla Chunk 1: Puntos 1 a 14 */}
                      <div className="text-[11px] font-bold text-gray-800 uppercase mb-1.5 flex justify-between">
                        <span>Puntos Priorizados de Espacio Público (1 a 14 de {p05Full.length})</span>
                        <span className="text-gray-400 font-normal text-[10px]">Sostenido = S + A · Recaída = N</span>
                      </div>
                      <table className="w-full text-left text-[9.5px] border-collapse border border-gray-200">
                        <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                          <tr>
                            <th className="py-1 px-1.5 w-6 text-center border-r border-gray-200">#</th>
                            <th className="py-1 px-1.5 w-24 border-r border-gray-200">Localidad</th>
                            <th className="py-1 px-1.5 border-r border-gray-200">Dirección del Punto</th>
                            <th className="py-1 px-1.5 w-24 text-center border-r border-gray-200">Clasificación</th>
                            <th className="py-1 px-1.5 w-10 text-center border-r border-gray-200">ISP</th>
                            <th className="py-1 px-1.5 w-36">Problemática del Punto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {p05Full.slice(0, 14).map((p, idx) => (
                            <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                              <td className="py-1 px-1.5 text-center font-mono text-gray-400 border-r border-gray-100">{idx + 1}</td>
                              <td className="py-1 px-1.5 font-semibold text-gray-800 border-r border-gray-100">{p.ld}</td>
                              <td className="py-1 px-1.5 text-gray-900 border-r border-gray-100">{p.d}</td>
                              <td className="py-1 px-1.5 text-center border-r border-gray-100">
                                <span className="inline-block px-1.5 py-0.2 rounded-full text-[8.5px] font-bold" style={{ background: p.chipBg, color: p.chipFg }}>
                                  {p.estado}
                                </span>
                              </td>
                              <td className="py-1 px-1.5 text-center font-mono font-bold text-gray-700 border-r border-gray-100">{p.ispTxt}</td>
                              <td className="py-1 px-1.5 text-gray-600 truncate max-w-[140px]">{p.riesgo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="border-t border-gray-200 pt-1.5 flex justify-between items-center text-[9px] text-gray-500">
                      <span>Alcaldía Mayor de Bogotá D.C. · Secretaría Distrital de Gobierno · Subsecretaría de Gestión Local</span>
                      <span>Página 1 de 3 · Formato Carta</span>
                    </div>
                  </div>

                  {/* HOJA 2 DE 3 */}
                  <div
                    className="hoja-carta-exportable bg-white shadow-xl rounded-sm text-gray-900 flex flex-col justify-between"
                    style={{
                      width: '215.9mm',
                      minHeight: '279.4mm',
                      maxHeight: '279.4mm',
                      padding: '11mm 13mm',
                      boxSizing: 'border-box',
                      fontFamily: '"Source Sans 3", "Segoe UI", system-ui, sans-serif',
                      overflow: 'hidden'
                    }}
                  >
                    <div>
                      {/* Encabezado Hoja 2 */}
                      <div className="border-b border-gray-200 pb-1.5 mb-3 flex justify-between items-center">
                        <div className="text-[10px] font-bold text-gray-700 uppercase">
                          P05 Recuperación de Espacio Público · Puntos Priorizados (15 a 34 de {p05Full.length})
                        </div>
                        <div className="text-[9px] text-gray-400">
                          Corte: 15 Octubre 2026 · Sostenimiento Distrital P05: <strong>{r5Full.pctTxt}%</strong>
                        </div>
                      </div>

                      <table className="w-full text-left text-[9.5px] border-collapse border border-gray-200">
                        <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                          <tr>
                            <th className="py-1 px-1.5 w-6 text-center border-r border-gray-200">#</th>
                            <th className="py-1 px-1.5 w-24 border-r border-gray-200">Localidad</th>
                            <th className="py-1 px-1.5 border-r border-gray-200">Dirección del Punto</th>
                            <th className="py-1 px-1.5 w-24 text-center border-r border-gray-200">Clasificación</th>
                            <th className="py-1 px-1.5 w-10 text-center border-r border-gray-200">ISP</th>
                            <th className="py-1 px-1.5 w-36">Problemática del Punto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {p05Full.slice(14, 34).map((p, idx) => (
                            <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                              <td className="py-1 px-1.5 text-center font-mono text-gray-400 border-r border-gray-100">{idx + 15}</td>
                              <td className="py-1 px-1.5 font-semibold text-gray-800 border-r border-gray-100">{p.ld}</td>
                              <td className="py-1 px-1.5 text-gray-900 border-r border-gray-100">{p.d}</td>
                              <td className="py-1 px-1.5 text-center border-r border-gray-100">
                                <span className="inline-block px-1.5 py-0.2 rounded-full text-[8.5px] font-bold" style={{ background: p.chipBg, color: p.chipFg }}>
                                  {p.estado}
                                </span>
                              </td>
                              <td className="py-1 px-1.5 text-center font-mono font-bold text-gray-700 border-r border-gray-100">{p.ispTxt}</td>
                              <td className="py-1 px-1.5 text-gray-600 truncate max-w-[140px]">{p.riesgo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="border-t border-gray-200 pt-1.5 flex justify-between items-center text-[9px] text-gray-500">
                      <span>Alcaldía Mayor de Bogotá D.C. · Secretaría Distrital de Gobierno · Subsecretaría de Gestión Local</span>
                      <span>Página 2 de 3 · Formato Carta</span>
                    </div>
                  </div>

                  {/* HOJA 3 DE 3 */}
                  <div
                    className="hoja-carta-exportable bg-white shadow-xl rounded-sm text-gray-900 flex flex-col justify-between"
                    style={{
                      width: '215.9mm',
                      minHeight: '279.4mm',
                      maxHeight: '279.4mm',
                      padding: '11mm 13mm',
                      boxSizing: 'border-box',
                      fontFamily: '"Source Sans 3", "Segoe UI", system-ui, sans-serif',
                      overflow: 'hidden'
                    }}
                  >
                    <div>
                      {/* Encabezado Hoja 3 */}
                      <div className="border-b border-gray-200 pb-1.5 mb-3 flex justify-between items-center">
                        <div className="text-[10px] font-bold text-gray-700 uppercase">
                          P05 Recuperación de Espacio Público · Puntos Priorizados (35 a 46 de {p05Full.length}) y Condiciones
                        </div>
                        <div className="text-[9px] text-gray-400">
                          Corte: 15 Octubre 2026 · Cierre de Evaluación
                        </div>
                      </div>

                      {/* Tabla Chunk 3 */}
                      <table className="w-full text-left text-[9.5px] border-collapse border border-gray-200 mb-4">
                        <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                          <tr>
                            <th className="py-1 px-1.5 w-6 text-center border-r border-gray-200">#</th>
                            <th className="py-1 px-1.5 w-24 border-r border-gray-200">Localidad</th>
                            <th className="py-1 px-1.5 border-r border-gray-200">Dirección del Punto</th>
                            <th className="py-1 px-1.5 w-24 text-center border-r border-gray-200">Clasificación</th>
                            <th className="py-1 px-1.5 w-10 text-center border-r border-gray-200">ISP</th>
                            <th className="py-1 px-1.5 w-36">Problemática del Punto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {p05Full.slice(34, 46).map((p, idx) => (
                            <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                              <td className="py-1 px-1.5 text-center font-mono text-gray-400 border-r border-gray-100">{idx + 35}</td>
                              <td className="py-1 px-1.5 font-semibold text-gray-800 border-r border-gray-100">{p.ld}</td>
                              <td className="py-1 px-1.5 text-gray-900 border-r border-gray-100">{p.d}</td>
                              <td className="py-1 px-1.5 text-center border-r border-gray-100">
                                <span className="inline-block px-1.5 py-0.2 rounded-full text-[8.5px] font-bold" style={{ background: p.chipBg, color: p.chipFg }}>
                                  {p.estado}
                                </span>
                              </td>
                              <td className="py-1 px-1.5 text-center font-mono font-bold text-gray-700 border-r border-gray-100">{p.ispTxt}</td>
                              <td className="py-1 px-1.5 text-gray-600 truncate max-w-[140px]">{p.riesgo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Condiciones físicas y acciones de control */}
                      <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div>
                          <div className="text-[10px] font-bold text-gray-800 uppercase mb-1.5">
                            Condiciones Físicas de Entrega
                          </div>
                          <div className="space-y-1.5 text-[9px]">
                            {condicionesP05List.map(c => (
                              <div key={c.label}>
                                <div className="flex justify-between font-semibold text-gray-700">
                                  <span>{c.label}</span>
                                  <span>{c.pctAvance}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1 mt-0.5">
                                  <div className="bg-green-600 h-1 rounded-full" style={{ width: `${c.pctAvance}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-gray-800 uppercase mb-1.5">
                            Directrices de Gestión y Control (IVC)
                          </div>
                          <div className="space-y-1 text-[9px] text-gray-600">
                            <div>• Mantener operativos periódicos de Inspección, Vigilancia y Control.</div>
                            <div>• Sensibilización continua a vendedores informales hacia relocalización.</div>
                            <div>• Control preventivo estricto sobre parqueo indebido sobre andenes.</div>
                            <div>• Sostenimiento consolidado distrital: <strong className="text-green-700">{r5Full.pctTxt}%</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-1.5 flex justify-between items-center text-[9px] text-gray-500">
                      <span>Alcaldía Mayor de Bogotá D.C. · Secretaría Distrital de Gobierno · Subsecretaría de Gestión Local</span>
                      <span>Página 3 de 3 · Formato Carta</span>
                    </div>
                  </div>
                </>
              )}

              {/* VISTA AMBOS: CONSOLIDADO DISTRITAL (2 HOJAS CARTA) */}
              {exportTab === 'AMBOS' && (
                <>
                  {/* HOJA 1 DE 2 */}
                  <div
                    className="hoja-carta-exportable bg-white shadow-xl rounded-sm text-gray-900 flex flex-col justify-between"
                    style={{
                      width: '215.9mm',
                      minHeight: '279.4mm',
                      maxHeight: '279.4mm',
                      padding: '11mm 13mm',
                      boxSizing: 'border-box',
                      fontFamily: '"Source Sans 3", "Segoe UI", system-ui, sans-serif',
                      overflow: 'hidden'
                    }}
                  >
                    <div>
                      {/* Encabezado Hoja 1 */}
                      <div className="border-b-2 border-red-600 pb-2 mb-3 flex justify-between items-start">
                        <div>
                          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                            Alcaldía Mayor de Bogotá D.C. · Secretaría Distrital de Gobierno
                          </div>
                          <div className="text-[9px] font-semibold text-gray-500">
                            Subsecretaría de Gestión Local · Grupo de Espacio Público · RADAR
                          </div>
                          <h1 className="text-base font-bold text-gray-900 mt-0.5 uppercase" style={{ fontFamily: 'Archivo, system-ui, sans-serif' }}>
                            Informe Distrital Consolidado · Sostenibilidad de Puntos (P04 + P05)
                          </h1>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="inline-block bg-purple-50 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">
                            Fecha de Corte: 15 de Octubre de 2026
                          </div>
                          <div className="text-[9px] text-gray-400 mt-0.5">
                            Periodo de visita: {datos.periodoVisita} · Sync: {formatearFechaLectura(snapshot.ultimaLectura)}
                          </div>
                        </div>
                      </div>

                      {/* Tarjetas KPI Distritales */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
                          <div className="text-[10px] text-gray-500 font-medium">Puntos Distritales</div>
                          <div className="text-lg font-bold text-gray-900">{rTotalFull.pri}</div>
                          <div className="text-[9px] text-gray-400">60 en P04 + 46 en P05</div>
                        </div>
                        <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                          <div className="text-[10px] text-green-700 font-medium">% Sostenimiento Global</div>
                          <div className="text-lg font-bold text-green-700">{rTotalFull.pctTxt}%</div>
                          <div className="text-[9px] text-green-600">{rTotalFull.sost} puntos sostenidos</div>
                        </div>
                        <div className="bg-red-50 p-2 rounded border border-red-200 text-center">
                          <div className="text-[10px] text-red-700 font-medium">Recaídas Totales</div>
                          <div className="text-lg font-bold text-red-700">{rTotalFull.n}</div>
                          <div className="text-[9px] text-red-600">{((rTotalFull.n / rTotalFull.pri) * 100).toFixed(1).replace('.', ',')}% en el Distrito</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded border border-blue-200 text-center">
                          <div className="text-[10px] text-blue-700 font-medium">Cobertura de Visitas</div>
                          <div className="text-lg font-bold text-blue-700">{rTotalFull.ver} de {rTotalFull.pri}</div>
                          <div className="text-[9px] text-blue-600">{rTotalFull.v} sin verificar</div>
                        </div>
                      </div>

                      {/* Comparativa por Producto */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-blue-50/70 p-2 rounded border border-blue-200">
                          <div className="text-[10px] font-bold text-blue-900 mb-0.5">P04 · Gestión de Residuos</div>
                          <div className="text-xs font-semibold text-blue-800">
                            {r4Full.pri} priorizados · {r4Full.pctTxt}% sostenimiento
                          </div>
                          <div className="text-[9px] text-blue-700 mt-0.5">
                            {r4Full.sost} sostenidos / en riesgo · {r4Full.n} recaídas confirmadas
                          </div>
                        </div>
                        <div className="bg-amber-50/70 p-2 rounded border border-amber-200">
                          <div className="text-[10px] font-bold text-amber-900 mb-0.5">P05 · Espacio Público</div>
                          <div className="text-xs font-semibold text-amber-800">
                            {r5Full.pri} priorizados · {r5Full.pctTxt}% sostenimiento
                          </div>
                          <div className="text-[9px] text-amber-700 mt-0.5">
                            {r5Full.sost} sostenidos / en riesgo · {r5Full.n} recaídas confirmadas
                          </div>
                        </div>
                      </div>

                      {/* Matriz Localidades Parte 1 (1 a 10) */}
                      <div className="text-[11px] font-bold text-gray-800 uppercase mb-1.5 flex justify-between">
                        <span>Matriz Distrital por Localidades (Parte 1: Localidades 1 a 10)</span>
                        <span className="text-gray-400 font-normal text-[10px]">Consolidado Distrital P04 + P05</span>
                      </div>
                      <table className="w-full text-left text-[9.5px] border-collapse border border-gray-200">
                        <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                          <tr>
                            <th className="py-1 px-1.5 w-6 text-center border-r border-gray-200">Cód</th>
                            <th className="py-1 px-1.5 border-r border-gray-200">Localidad</th>
                            <th className="py-1 px-1.5 text-center bg-blue-50/50 border-r border-gray-200">P04 Pri</th>
                            <th className="py-1 px-1.5 text-center bg-blue-50/50 border-r border-gray-200">P04 Sost</th>
                            <th className="py-1 px-1.5 text-center bg-blue-50/50 border-r border-gray-200">P04 Rec</th>
                            <th className="py-1 px-1.5 text-center bg-amber-50/50 border-r border-gray-200">P05 Pri</th>
                            <th className="py-1 px-1.5 text-center bg-amber-50/50 border-r border-gray-200">P05 Sost</th>
                            <th className="py-1 px-1.5 text-center bg-amber-50/50 border-r border-gray-200">P05 Rec</th>
                            <th className="py-1 px-1.5 text-center font-bold border-r border-gray-200">Total Pri</th>
                            <th className="py-1 px-1.5 text-center font-bold">% Sostenimiento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {matriz.slice(0, 10).map(m => {
                            const totalPri = (typeof m.p4.pri === 'number' ? m.p4.pri : 0) + (typeof m.p5.pri === 'number' ? m.p5.pri : 0);
                            const totalSost = (typeof m.p4.sost === 'number' ? m.p4.sost : 0) + (typeof m.p5.sost === 'number' ? m.p5.sost : 0);
                            const pctGlobal = totalPri > 0 ? Math.round((totalSost / totalPri) * 100) : 0;
                            return (
                              <tr key={m.cod} className="hover:bg-gray-50/50">
                                <td className="py-1 px-1.5 text-center font-mono text-gray-400 border-r border-gray-100">{m.cod}</td>
                                <td className="py-1 px-1.5 font-semibold text-gray-800 border-r border-gray-100">{m.ld}</td>
                                <td className="py-1 px-1.5 text-center bg-blue-50/20 border-r border-gray-100">{m.p4.pri}</td>
                                <td className="py-1 px-1.5 text-center bg-blue-50/20 font-bold text-green-700 border-r border-gray-100">{m.p4.sost}</td>
                                <td className="py-1 px-1.5 text-center bg-blue-50/20 text-red-700 border-r border-gray-100">{m.p4.noSost}</td>
                                <td className="py-1 px-1.5 text-center bg-amber-50/20 border-r border-gray-100">{m.p5.pri}</td>
                                <td className="py-1 px-1.5 text-center bg-amber-50/20 font-bold text-green-700 border-r border-gray-100">{m.p5.sost}</td>
                                <td className="py-1 px-1.5 text-center bg-amber-50/20 text-red-700 border-r border-gray-100">{m.p5.noSost}</td>
                                <td className="py-1 px-1.5 text-center font-bold text-gray-900 border-r border-gray-100">{totalPri || '—'}</td>
                                <td className="py-1 px-1.5 text-center font-bold text-green-800">{totalPri > 0 ? `${pctGlobal}%` : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="border-t border-gray-200 pt-1.5 flex justify-between items-center text-[9px] text-gray-500">
                      <span>Alcaldía Mayor de Bogotá D.C. · Secretaría Distrital de Gobierno · Subsecretaría de Gestión Local</span>
                      <span>Página 1 de 2 · Formato Carta</span>
                    </div>
                  </div>

                  {/* HOJA 2 DE 2 */}
                  <div
                    className="hoja-carta-exportable bg-white shadow-xl rounded-sm text-gray-900 flex flex-col justify-between"
                    style={{
                      width: '215.9mm',
                      minHeight: '279.4mm',
                      maxHeight: '279.4mm',
                      padding: '11mm 13mm',
                      boxSizing: 'border-box',
                      fontFamily: '"Source Sans 3", "Segoe UI", system-ui, sans-serif',
                      overflow: 'hidden'
                    }}
                  >
                    <div>
                      {/* Encabezado Hoja 2 */}
                      <div className="border-b border-gray-200 pb-1.5 mb-3 flex justify-between items-center">
                        <div className="text-[10px] font-bold text-gray-700 uppercase">
                          Consolidado Distrital · Matriz Local (Parte 2: Localidades 11 a 20) y Total
                        </div>
                        <div className="text-[9px] text-gray-400">
                          Corte: 15 Octubre 2026 · Cierre Distrital
                        </div>
                      </div>

                      {/* Matriz Localidades Parte 2 (11 a 20) */}
                      <table className="w-full text-left text-[9.5px] border-collapse border border-gray-200 mb-4">
                        <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                          <tr>
                            <th className="py-1 px-1.5 w-6 text-center border-r border-gray-200">Cód</th>
                            <th className="py-1 px-1.5 border-r border-gray-200">Localidad</th>
                            <th className="py-1 px-1.5 text-center bg-blue-50/50 border-r border-gray-200">P04 Pri</th>
                            <th className="py-1 px-1.5 text-center bg-blue-50/50 border-r border-gray-200">P04 Sost</th>
                            <th className="py-1 px-1.5 text-center bg-blue-50/50 border-r border-gray-200">P04 Rec</th>
                            <th className="py-1 px-1.5 text-center bg-amber-50/50 border-r border-gray-200">P05 Pri</th>
                            <th className="py-1 px-1.5 text-center bg-amber-50/50 border-r border-gray-200">P05 Sost</th>
                            <th className="py-1 px-1.5 text-center bg-amber-50/50 border-r border-gray-200">P05 Rec</th>
                            <th className="py-1 px-1.5 text-center font-bold border-r border-gray-200">Total Pri</th>
                            <th className="py-1 px-1.5 text-center font-bold">% Sostenimiento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {matriz.slice(10, 20).map(m => {
                            const totalPri = (typeof m.p4.pri === 'number' ? m.p4.pri : 0) + (typeof m.p5.pri === 'number' ? m.p5.pri : 0);
                            const totalSost = (typeof m.p4.sost === 'number' ? m.p4.sost : 0) + (typeof m.p5.sost === 'number' ? m.p5.sost : 0);
                            const pctGlobal = totalPri > 0 ? Math.round((totalSost / totalPri) * 100) : 0;
                            return (
                              <tr key={m.cod} className="hover:bg-gray-50/50">
                                <td className="py-1 px-1.5 text-center font-mono text-gray-400 border-r border-gray-100">{m.cod}</td>
                                <td className="py-1 px-1.5 font-semibold text-gray-800 border-r border-gray-100">{m.ld}</td>
                                <td className="py-1 px-1.5 text-center bg-blue-50/20 border-r border-gray-100">{m.p4.pri}</td>
                                <td className="py-1 px-1.5 text-center bg-blue-50/20 font-bold text-green-700 border-r border-gray-100">{m.p4.sost}</td>
                                <td className="py-1 px-1.5 text-center bg-blue-50/20 text-red-700 border-r border-gray-100">{m.p4.noSost}</td>
                                <td className="py-1 px-1.5 text-center bg-amber-50/20 border-r border-gray-100">{m.p5.pri}</td>
                                <td className="py-1 px-1.5 text-center bg-amber-50/20 font-bold text-green-700 border-r border-gray-100">{m.p5.sost}</td>
                                <td className="py-1 px-1.5 text-center bg-amber-50/20 text-red-700 border-r border-gray-100">{m.p5.noSost}</td>
                                <td className="py-1 px-1.5 text-center font-bold text-gray-900 border-r border-gray-100">{totalPri || '—'}</td>
                                <td className="py-1 px-1.5 text-center font-bold text-green-800">{totalPri > 0 ? `${pctGlobal}%` : '—'}</td>
                              </tr>
                            );
                          })}
                          {/* Fila Total Distrital */}
                          <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                            <td className="py-1 px-1.5 text-center font-mono border-r border-gray-300">—</td>
                            <td className="py-1 px-1.5 text-gray-900 border-r border-gray-300 uppercase">TOTAL DISTRITAL</td>
                            <td className="py-1 px-1.5 text-center bg-blue-100/50 border-r border-gray-300">{r4Full.pri}</td>
                            <td className="py-1 px-1.5 text-center bg-blue-100/50 text-green-800 border-r border-gray-300">{r4Full.sost}</td>
                            <td className="py-1 px-1.5 text-center bg-blue-100/50 text-red-800 border-r border-gray-300">{r4Full.n}</td>
                            <td className="py-1 px-1.5 text-center bg-amber-100/50 border-r border-gray-300">{r5Full.pri}</td>
                            <td className="py-1 px-1.5 text-center bg-amber-100/50 text-green-800 border-r border-gray-300">{r5Full.sost}</td>
                            <td className="py-1 px-1.5 text-center bg-amber-100/50 text-red-800 border-r border-gray-300">{r5Full.n}</td>
                            <td className="py-1 px-1.5 text-center font-bold text-gray-900 border-r border-gray-300">{rTotalFull.pri}</td>
                            <td className="py-1 px-1.5 text-center font-bold text-green-900">{rTotalFull.pctTxt}%</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Lineamientos y Reglas Oficiales */}
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-[10px] font-bold text-gray-800 uppercase mb-1.5">
                          Lineamientos Operativos y Reglas Oficiales de Seguimiento
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-[9px] text-gray-600">
                          <div>
                            <div>• <strong>Sostenido suma dos clases:</strong> Los clasificados Sostenido y En riesgo cuentan como sostenidos.</div>
                            <div>• <strong>Recaída confirmada:</strong> Es la única clase no sostenida que exige reintervención operativa inmediata.</div>
                          </div>
                          <div>
                            <div>• <strong>Criterio de corte:</strong> Última verificación registrada en territorio dentro del periodo de corte.</div>
                            <div>• <strong>Coordinación local:</strong> Las Alcaldías Locales priorizan jornadas de sostenimiento en puntos en riesgo.</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-1.5 flex justify-between items-center text-[9px] text-gray-500">
                      <span>Alcaldía Mayor de Bogotá D.C. · Secretaría Distrital de Gobierno · Subsecretaría de Gestión Local</span>
                      <span>Página 2 de 2 · Formato Carta</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Pie del Modal con Botones */}
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex flex-wrap justify-between items-center gap-3">
              <div className="text-xs text-gray-500">
                Puntos incluidos: <strong>
                  {exportTab === 'P04' ? `${p04Full.length} puntos de Residuos (3 hojas carta)` : exportTab === 'P05' ? `${p05Full.length} puntos de Espacio Público (3 hojas carta)` : `${p04Full.length + p05Full.length} puntos distritales (2 hojas carta)`}
                </strong> · Corte oficial 15 de Octubre de 2026
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={exportarConsolidadoPdfCarta}
                  disabled={generandoConsolidadoPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {generandoConsolidadoPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{generandoConsolidadoPdf ? 'Generando PDF...' : 'Descargar PDF (Carta)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
