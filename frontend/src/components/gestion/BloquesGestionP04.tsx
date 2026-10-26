import { useState } from 'react';
import { X, Calendar, UserCheck, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Download, Printer, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { GestionP04Datos, PuntoFocalizadoOct } from './datosGestionP04';

interface BloquesGestionProps {
  gestion: GestionP04Datos;
  totalIntervencionesLive?: number;
  onVerFocalizadosEnMapa?: () => void;
}

const nf = (n: number, dec = 0) => {
  const s = Number(n).toFixed(dec);
  const parts = s.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.length > 1 ? `${parts[0]},${parts[1]}` : parts[0];
};

export function BloquesGestionP04({ gestion, totalIntervencionesLive, onVerFocalizadosEnMapa }: BloquesGestionProps) {
  const totalInterv = totalIntervencionesLive || gestion.gestion.intervencionesReportadas;
  const maxSerie = Math.max(...gestion.gestion.serieMensual.map(s => s.i), 1);
  const maxRank = Math.max(...gestion.rankingLocalidad.map(r => r.i), 1);

  return (
    <div style={{ borderBottom: '2px solid #E5E7EB', background: '#FFFFFF', fontFamily: '"Source Sans 3", system-ui, sans-serif' }}>
      {/* Sub-navegación rápida interna de Gestión P04 */}
      <div
        style={{
          background: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
          padding: '10px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 16px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            style={{
              fontSize: '11px',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: '#4B5563',
              fontFamily: 'Archivo, system-ui, sans-serif',
            }}
          >
            Tablero de gestión de intervenciones · Residuos:
          </span>
          {[
            { href: '#p04-universo', label: '1. Universo de puntos' },
            { href: '#p04-resultado', label: '2. Indicadores de resultado' },
            { href: '#p04-gestion', label: '3. Indicadores de gestión' },
            { href: '#p04-ranking', label: '4. Ranking por localidad' },
            { href: '#p04-sostenimiento', label: '5. Sostenimiento (60 priorizados)' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-semibold text-gray-700 hover:text-red-700 bg-white border border-gray-200 rounded-md px-2.5 py-1 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
          Fuente en línea: Formulario «Operación Espacio Público» ({nf(totalInterv)} registros) · Corte {gestion.corte}
        </span>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {/* ============ 1 · EL UNIVERSO DE PUNTOS CRÍTICOS ============ */}
        <div id="p04-universo">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              gap: '12px',
              borderBottom: '2px solid #1F2937',
              paddingBottom: '8px',
            }}
          >
            <h3 style={{ margin: 0, fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '19px', fontWeight: 700, color: '#1F2937' }}>
              1 · El universo de puntos críticos
            </h3>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              Censo 2026 liderado por la SDG con alcaldías locales y UAESP, verificado con Aguas de Bogotá
            </span>
          </div>

          {/* Flujo de cajas del censo */}
          <div style={{ marginTop: '18px', display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: '8px' }}>
            <div style={{ flex: '1 1 165px', minWidth: '155px', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '14px 16px', background: '#F9FAFB' }}>
              <div style={{ fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                Base PGIRS
              </div>
              <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '36px', fontWeight: 700, lineHeight: 1.05, marginTop: '5px', color: '#4B5563', fontVariantNumeric: 'tabular-nums' }}>
                {nf(gestion.universo.basePgirs)}
              </div>
              <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '4px' }}>activos al inicio de 2026</div>
            </div>

            <div style={{ flex: '0 0 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#9CA3AF', fontWeight: 700 }} aria-hidden="true">
              →
            </div>

            <div style={{ flex: '1 1 165px', minWidth: '155px', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '14px 16px', background: '#FFFFFF' }}>
              <div style={{ fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                Se mantienen activos
              </div>
              <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '36px', fontWeight: 700, lineHeight: 1.05, marginTop: '5px', color: '#1F2937', fontVariantNumeric: 'tabular-nums' }}>
                {nf(gestion.universo.activosCenso)}
              </div>
              <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '4px' }}>verificados en el censo</div>
            </div>

            <div style={{ flex: '0 0 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#9CA3AF', fontWeight: 700 }} aria-hidden="true">
              +
            </div>

            <div style={{ flex: '1 1 165px', minWidth: '155px', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '14px 16px', background: '#FFFFFF' }}>
              <div style={{ fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                Puntos nuevos
              </div>
              <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '36px', fontWeight: 700, lineHeight: 1.05, marginTop: '5px', color: '#1F2937', fontVariantNumeric: 'tabular-nums' }}>
                {nf(gestion.universo.nuevos)}
              </div>
              <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '4px' }}>generados o desplazados</div>
            </div>

            <div style={{ flex: '0 0 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#9CA3AF', fontWeight: 700 }} aria-hidden="true">
              =
            </div>

            <div style={{ flex: '1 1 180px', minWidth: '165px', border: '2px solid #E3002B', borderTop: '5px solid #E3002B', borderRadius: '6px', padding: '14px 16px', background: '#FEF2F2' }}>
              <div style={{ fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#B91C1C', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                Activos y confirmados
              </div>
              <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '42px', fontWeight: 700, lineHeight: 1.05, marginTop: '5px', color: '#E3002B', fontVariantNumeric: 'tabular-nums' }}>
                {nf(gestion.universo.confirmados)}
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px', color: '#991B1B', fontWeight: 600 }}>universo de trabajo 2026</div>
            </div>

            <div style={{ flex: '0 0 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#9CA3AF', fontWeight: 700 }} aria-hidden="true">
              +
            </div>

            <div
              style={{
                flex: '1 1 190px',
                minWidth: '175px',
                border: '1px solid #C4B5FD',
                borderTop: '4px solid #7C3AED',
                borderRadius: '6px',
                padding: '14px 16px',
                background: '#F5F3FF',
              }}
            >
              <div style={{ fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#5B21B6', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                En confirmación UAESP
              </div>
              <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '36px', fontWeight: 700, lineHeight: 1.05, marginTop: '5px', color: '#1F2937', fontVariantNumeric: 'tabular-nums' }}>
                {nf(gestion.universo.enConfirmacion)}
              </div>
              <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                <span>campo oct–nov · <strong>{gestion.universo.accionesFocalizadasOct} con acciones</strong></span>
                {onVerFocalizadosEnMapa && (
                  <button
                    type="button"
                    onClick={onVerFocalizadosEnMapa}
                    className="text-[11px] font-bold text-purple-800 underline hover:text-purple-950 cursor-pointer"
                  >
                    Ver 21 en mapa ↑
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Trayectoria de la meta del plan + Comentario estratégico */}
          <div style={{ marginTop: '18px', display: 'flex', flexWrap: 'wrap', gap: '18px' }}>
            <div style={{ flex: '1 1 540px', minWidth: '300px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '18px 20px', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '13.5px', fontWeight: 700, color: '#1F2937' }}>
                  Trayectoria de la meta del plan
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11.5px', fontFamily: 'Archivo, system-ui, sans-serif' }}>
                  <span className="inline-flex items-center gap-1.5" style={{ color: '#16A34A', fontWeight: 700 }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#16A34A', display: 'inline-block' }} />
                    Meta 2027: 600
                  </span>
                  <span className="inline-flex items-center gap-1.5" style={{ color: '#E3002B', fontWeight: 700 }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#E3002B', display: 'inline-block' }} />
                    Confirmado: 385
                  </span>
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
                {gestion.universo.trayectoria.map((item, idx) => {
                  const isMeta600 = item.val === 600;
                  const isConf385 = item.val === 385;
                  const barBg = isMeta600 ? '#16A34A' : isConf385 ? '#E3002B' : item.bg;
                  const textFg = isMeta600 ? '#16A34A' : isConf385 ? '#E3002B' : item.fg;
                  return (
                    <div
                      key={item.label}
                      style={{
                        flex: '1 1 75px',
                        textAlign: 'center',
                        marginLeft: idx === 4 ? '14px' : 0,
                      }}
                    >
                      <div
                        style={{
                          height: `${item.h}px`,
                          background: barBg,
                          border: item.border || 'none',
                          borderBottom: 'none',
                          borderRadius: '4px 4px 0 0',
                          boxShadow: isConf385 ? '0 2px 8px rgba(227,0,43,0.3)' : isMeta600 ? '0 2px 8px rgba(22,163,74,0.3)' : 'none',
                        }}
                      />
                      <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '19px', fontWeight: 700, marginTop: '7px', color: textFg, fontVariantNumeric: 'tabular-nums' }}>
                        {nf(item.val)}
                      </div>
                      <div style={{ fontSize: '11px', color: isConf385 ? '#B91C1C' : isMeta600 ? '#15803D' : '#6B7280', fontWeight: 700 }}>
                        {item.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                flex: '1 1 320px',
                minWidth: '280px',
                border: '1px solid #FECACA',
                borderLeft: '5px solid #E3002B',
                borderRadius: '6px',
                padding: '16px 20px',
                background: '#FEF2F2',
              }}
            >
              <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '11px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#E3002B', fontWeight: 700 }}>
                Observación / Avance
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '13.5px', lineHeight: 1.55, color: '#1F2937' }}>
                El universo confirmado (<strong style={{ color: '#E3002B', fontSize: '14.5px' }}>385</strong>) y el máximo posible (<strong style={{ color: '#B91C1C' }}>481</strong>) quedan por debajo de la meta 2026 de <strong>640</strong> y se aproximan a la meta de cuatrienio de <strong style={{ color: '#16A34A', fontSize: '14.5px' }}>600</strong>. Parte de esa diferencia viene del censo —una medición nueva— y no solo de reducción efectiva.
              </p>
              <p style={{ margin: '10px 0 0 0', fontSize: '13.5px', lineHeight: 1.55, color: '#1F2937' }}>
                La cifra es favorable, pero su lectura depende de que el cambio de método quede explícito: sin eso, la caída de <strong style={{ color: '#4B5563' }}>700</strong> a <strong style={{ color: '#E3002B', fontWeight: 800 }}>481</strong> admite leerse como depuración de base y no como gestión.
              </p>
            </div>
          </div>
        </div>

        {/* ============ 2 · INDICADORES DE RESULTADO ============ */}
        <div id="p04-resultado">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              gap: '12px',
              borderBottom: '2px solid #E3002B',
              paddingBottom: '8px',
            }}
          >
            <h3 style={{ margin: 0, fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '19px', fontWeight: 700, color: '#1F2937' }}>
              2 · Indicadores de resultado
            </h3>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              Metas de la vigencia. No se promedian entre sí.
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            {/* Tarjeta 1: Operativos de IVC en residuos */}
            <div style={{ border: '1px solid #E5E7EB', borderTop: '5px solid #16A34A', borderRadius: '6px', padding: '22px 24px', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '11.5px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700 }}>
                  Operativos de IVC en residuos
                </span>
                <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', fontFamily: 'Archivo, system-ui, sans-serif' }}>
                  ✓ Sobrecumplido
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '68px', fontWeight: 700, lineHeight: 0.95, color: '#16A34A', fontVariantNumeric: 'tabular-nums' }}>
                  {gestion.resultado.ivcPct}
                  <span style={{ fontSize: '34px' }}>%</span>
                </div>
                <div style={{ paddingBottom: '6px' }}>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '24px', fontWeight: 700, color: '#1F2937', fontVariantNumeric: 'tabular-nums' }}>
                    {nf(gestion.resultado.ivcOperativos)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                    de una meta de {nf(gestion.resultado.ivcMeta)}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '14px', height: '10px', background: '#DCFCE7', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: '66%', height: '100%', background: '#16A34A' }} title="Meta cumplida: 1.000 (100%)" />
                <div style={{ width: '34%', height: '100%', background: '#22C55E' }} title="Sobrecumplimiento: +514 (151%)" />
              </div>
              <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#166534', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                <span>Meta {nf(gestion.resultado.ivcMeta)} (100%)</span>
                <span>+{nf(gestion.resultado.ivcOperativos - gestion.resultado.ivcMeta)} por encima de la meta ({gestion.resultado.ivcPct}%)</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 mt-4">
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 12px', background: '#F9FAFB' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                    Comparendos
                  </div>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '22px', fontWeight: 700, marginTop: '2px', color: '#1F2937', fontVariantNumeric: 'tabular-nums' }}>
                    {nf(gestion.resultado.ivcComparendos)}
                  </div>
                </div>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 12px', background: '#F9FAFB' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                    En puntos críticos
                  </div>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '22px', fontWeight: 700, marginTop: '2px', color: '#E3002B', fontVariantNumeric: 'tabular-nums' }}>
                    {nf(gestion.resultado.ivcPuntosCriticos)}
                  </div>
                </div>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 12px', background: '#F9FAFB' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                    En cambuches
                  </div>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '22px', fontWeight: 700, marginTop: '2px', color: '#1F2937', fontVariantNumeric: 'tabular-nums' }}>
                    {nf(gestion.resultado.ivcCambuches)}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #F3F4F6', fontSize: '11.5px', color: '#6B7280', lineHeight: 1.5 }}>
                Fuente: tablero de Gestión Policiva — IVC basuras, carreteros, cambuches y puntos críticos, 01/01/2026 a 17/10/2026.
              </div>
            </div>

            {/* Tarjeta 2: Sensibilizaciones en residuos */}
            <div style={{ border: '1px solid #E5E7EB', borderTop: '5px solid #16A34A', borderRadius: '6px', padding: '22px 24px', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '11.5px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700 }}>
                  Sensibilizaciones en residuos
                </span>
                <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', fontFamily: 'Archivo, system-ui, sans-serif' }}>
                  ✓ Sobrecumplido
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '68px', fontWeight: 700, lineHeight: 0.95, color: '#16A34A', fontVariantNumeric: 'tabular-nums' }}>
                  {gestion.resultado.sensPct}
                  <span style={{ fontSize: '34px' }}>%</span>
                </div>
                <div style={{ paddingBottom: '6px' }}>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '24px', fontWeight: 700, color: '#1F2937', fontVariantNumeric: 'tabular-nums' }}>
                    {nf(gestion.resultado.sensParticipantes)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                    de una meta de {nf(gestion.resultado.sensMeta)}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '14px', height: '10px', background: '#DCFCE7', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: '79%', height: '100%', background: '#16A34A' }} title="Meta cumplida: 15.000 (100%)" />
                <div style={{ width: '21%', height: '100%', background: '#22C55E' }} title="Sobrecumplimiento: +4.048 (127%)" />
              </div>
              <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#166534', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                <span>Meta {nf(gestion.resultado.sensMeta)} (100%)</span>
                <span>+{nf(gestion.resultado.sensParticipantes - gestion.resultado.sensMeta)} por encima de la meta ({gestion.resultado.sensPct}%)</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 mt-4">
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 12px', background: '#F9FAFB' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                    Registros
                  </div>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '22px', fontWeight: 700, marginTop: '2px', color: '#1F2937', fontVariantNumeric: 'tabular-nums' }}>
                    {nf(gestion.resultado.sensRegistros)}
                  </div>
                </div>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 12px', background: '#F9FAFB' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                    Promedio por jornada
                  </div>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '22px', fontWeight: 700, marginTop: '2px', color: '#1F2937', fontVariantNumeric: 'tabular-nums' }}>
                    {nf(gestion.resultado.sensPromedio)}
                  </div>
                </div>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 12px', background: '#F9FAFB' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '.06em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                    Localidades
                  </div>
                  <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '22px', fontWeight: 700, marginTop: '2px', color: '#1F2937', fontVariantNumeric: 'tabular-nums' }}>
                    {nf(gestion.resultado.sensLocalidades)}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #F3F4F6', fontSize: '11.5px', color: '#6B7280', lineHeight: 1.5 }}>
                Cuenta únicamente registros de tipo «Campaña de sensibilización» del componente residuos. Las campañas de apropiación y las jornadas de recolección aportan otros 7.189 participantes.
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              border: '1px solid #BBF7D0',
              borderLeft: '5px solid #16A34A',
              borderRadius: '6px',
              padding: '14px 18px',
              background: '#F0FDF4',
            }}
          >
            <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '11px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#15803D', fontWeight: 700 }}>
              Observación / Avance
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', lineHeight: 1.55, color: '#14532D' }}>
              Las dos metas de resultado están <strong style={{ color: '#16A34A', fontWeight: 800 }}>sobrecumplidas a octubre</strong> (<strong style={{ color: '#16A34A' }}>110%</strong> en operativos IVC con <strong style={{ color: '#16A34A' }}>3.310</strong> realizados y <strong style={{ color: '#16A34A' }}>127%</strong> en sensibilización con <strong style={{ color: '#16A34A' }}>19.048</strong> participantes), de modo que pierden capacidad de tracción en el trimestre que queda: seguir sumando operativos y participantes ya no mueve el indicador. El tercer indicador de resultado —la <strong style={{ color: '#15803D' }}>sostenibilidad de los puntos priorizados</strong> (abajo en el <strong style={{ color: '#166534' }}>bloque 5</strong>)— es el único que sigue abierto.
            </p>
          </div>
        </div>

        {/* ============ 3 · INDICADORES DE GESTIÓN ============ */}
        <div id="p04-gestion">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              gap: '12px',
              borderBottom: '2px solid #E3002B',
              paddingBottom: '8px',
            }}
          >
            <h3 style={{ margin: 0, fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '19px', fontWeight: 700, color: '#1F2937' }}>
              3 · Indicadores de gestión
            </h3>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              Esfuerzo desplegado en territorio · {nf(totalInterv)} registros de residuos
            </span>
          </div>

          {/* 5 KPIs de Gestión */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-5">
            {[
              { lab: 'Puntos distintos intervenidos', val: nf(gestion.gestion.puntosDistintos50m), sub: 'criterio de 50 m', c: '#E3002B', valColor: '#E3002B' },
              { lab: 'Intervenciones reportadas', val: nf(totalInterv), sub: `${nf(gestion.gestion.intervencionesAgrupables)} agrupables en puntos`, c: '#1F2937', valColor: '#1F2937' },
              { lab: 'Residuos recolectados', val: nf(gestion.gestion.residuosRecolectados), sub: 'm³ retirados', c: '#16A34A', valColor: '#16A34A' },
              { lab: 'Cambuches retirados', val: nf(gestion.gestion.cambuchesRetirados), sub: `en ${nf(gestion.gestion.intervencionesConCambuches)} intervenciones`, c: '#E3002B', valColor: '#B91C1C' },
              { lab: 'Área recuperada', val: nf(gestion.gestion.areaRecuperadaM2), sub: 'metros cuadrados intervenidos', c: '#1F2937', valColor: '#1F2937' },
            ].map(t => (
              <div
                key={t.lab}
                style={{
                  border: '1px solid #E5E7EB',
                  borderTop: `4px solid ${t.c}`,
                  borderRadius: '6px',
                  padding: '15px 16px',
                  background: '#FFFFFF',
                }}
              >
                <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '10.5px', letterSpacing: '.07em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, minHeight: '26px' }}>
                  {t.lab}
                </div>
                <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '30px', fontWeight: 700, lineHeight: 1.05, marginTop: '6px', color: t.valColor, fontVariantNumeric: 'tabular-nums' }}>
                  {t.val}
                </div>
                <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '4px' }}>{t.sub}</div>
              </div>
            ))}
          </div>

          {/* Serie mensual y Composición por tipo de intervención */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            <div className="lg:col-span-2" style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '18px 20px', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '13.5px', fontWeight: 700, color: '#1F2937' }}>
                  Puntos intervenidos por mes
                </div>
                <div style={{ display: 'flex', gap: '14px', fontSize: '11.5px', color: '#4B5563', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                  <span className="inline-flex items-center gap-1.5" style={{ color: '#475569' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#94A3B8', borderRadius: '2px' }} />
                    Puntos intervenidos
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '18px', display: 'flex', gap: '10px', alignItems: 'flex-end', height: '180px' }}>
                {gestion.gestion.serieMensual.map(s => {
                  const hi = Math.round((s.i / maxSerie) * 145);
                  return (
                    <div key={s.m} style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '11px', fontWeight: 700, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
                        {nf(s.i)}
                      </div>
                      <div style={{ width: '100%', maxWidth: '38px', display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                        <div
                          style={{ width: '100%', height: `${hi}px`, background: '#94A3B8', borderRadius: '3px 3px 0 0' }}
                          title={`${s.m}: ${nf(s.i)} puntos intervenidos`}
                        />
                      </div>
                      <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '11px', color: '#64748B', marginTop: '6px', fontWeight: 700 }}>
                        {s.m}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F3F4F6', fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>
                Octubre está en curso al corte. El pico de marzo–mayo coincide con el arranque del censo; el descenso desde junio es sostenido.
              </div>
            </div>

            <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', padding: '18px 20px', background: '#FFFFFF' }}>
              <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '13.5px', fontWeight: 700, color: '#1F2937' }}>
                Composición por tipo de intervención
              </div>
              <div style={{ marginTop: '16px' }}>
                {gestion.gestion.tiposIntervencion.map(tp => {
                  const barCol = tp.t.includes('Sensibiliza') ? '#FFCD00' : tp.t.includes('Recolec') ? '#E3002B' : '#16A34A';
                  return (
                    <div key={tp.t} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>{tp.t}</span>
                        <span style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '13px', fontWeight: 700, color: barCol, fontVariantNumeric: 'tabular-nums' }}>
                          {nf(tp.n)}
                        </span>
                      </div>
                      <div style={{ marginTop: '6px', height: '10px', background: '#F3F4F6', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${tp.w}%`, height: '100%', background: barCol }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>{tp.sub}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ paddingTop: '10px', borderTop: '1px solid #F3F4F6', fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>
                Casi la mitad de los registros son de sensibilización. La recolección —el tipo que produce resultado físico sobre el punto— es el 37% de la operación reportada.
              </div>
            </div>
          </div>

          {/* Nota pequeña del Punto 4: Individualización de puntos a 50 metros (Criterio UAESP) */}
          <div
            style={{
              marginTop: '14px',
              border: '1px solid #E5E7EB',
              borderLeft: '4px solid #1F2937',
              borderRadius: '6px',
              padding: '11px 16px',
              background: '#F9FAFB',
              fontSize: '12px',
              color: '#4B5563',
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: '#1F2937', fontFamily: 'Archivo, system-ui, sans-serif' }}>
              Nota metodológica · Individualización de puntos a 50 metros (Criterio UAESP):
            </strong>{' '}
            Toda intervención ubicada dentro de un polígono de 50 m de otra se agrupa en cadena como un mismo punto y suma sus resultados (<strong>{nf(gestion.gestion.intervencionesAgrupables)}</strong> registros agrupables conforman <strong>{nf(gestion.gestion.puntosDistintos50m)}</strong> puntos distintos, con diámetro máximo de <strong>{gestion.gestion.diametroMaxM} m</strong>; el <strong>{gestion.gestion.puntosUnaVisitaPct}%</strong> [{nf(gestion.gestion.puntosUnaVisita)} puntos] se visitó una sola vez y <strong>{gestion.gestion.puntosAltaRecurrencia}</strong> puntos registran 6 o más intervenciones). Las <strong>{nf(gestion.gestion.intervencionesNivelBarrio)}</strong> intervenciones georreferenciadas solo a nivel de barrio cuentan como intervención pero no forman punto.
          </div>
        </div>

        {/* ============ 4 · RANKING POR LOCALIDAD ============ */}
        <div id="p04-ranking">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              gap: '12px',
              borderBottom: '2px solid #E3002B',
              paddingBottom: '8px',
            }}
          >
            <h3 style={{ margin: 0, fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '19px', fontWeight: 700, color: '#1F2937' }}>
              4 · Ranking por localidad
            </h3>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              Ordenado por intervenciones reportadas en el formulario
            </span>
          </div>

          <div
            style={{
              marginTop: '16px',
              border: '1px solid #FECACA',
              borderLeft: '5px solid #E3002B',
              borderRadius: '6px',
              padding: '14px 18px',
              background: '#FEF2F2',
            }}
          >
            <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '11px', letterSpacing: '.08em', textTransform: 'uppercase', color: '#E3002B', fontWeight: 700 }}>
              Observación / Avance
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', lineHeight: 1.55, color: '#1F2937' }}>
              <strong style={{ color: '#1F2937' }}>San Cristóbal</strong> (<strong style={{ color: '#E3002B', fontSize: '14px' }}>546</strong>) y <strong style={{ color: '#1F2937' }}>Puente Aranda</strong> (<strong style={{ color: '#E3002B', fontSize: '14px' }}>364</strong>) concentran el <strong style={{ color: '#E3002B', fontSize: '14.5px' }}>46%</strong> de todos los reportes distritales, mientras Fontibón reporta <strong style={{ color: '#4B5563' }}>25</strong> y Sumapaz <strong style={{ color: '#4B5563' }}>4</strong>. Antes de leerlo como desempeño territorial hay que descartar asimetría de reporte: el ranking mide lo que se reporta en el formulario, no necesariamente toda la operación local.
            </p>
          </div>

          <div style={{ marginTop: '14px', border: '1px solid #E5E7EB', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '760px', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1F2937', color: '#FFFFFF', textAlign: 'left', fontFamily: 'Archivo, system-ui, sans-serif' }}>
                    <th style={{ padding: '10px 12px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '.06em', width: '40px' }}>#</th>
                    <th style={{ padding: '10px 12px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Localidad</th>
                    <th style={{ padding: '10px 12px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '.06em', width: '230px' }}>Intervenciones</th>
                    <th style={{ padding: '10px 12px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'right', width: '90px' }}>Puntos</th>
                    <th style={{ padding: '10px 12px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'right', width: '120px' }}>Residuos (m³)</th>
                    <th style={{ padding: '10px 12px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'right', width: '96px' }}>Cambuches</th>
                    <th style={{ padding: '10px 12px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'right', width: '104px' }}>m² recup.</th>
                  </tr>
                </thead>
                <tbody>
                  {gestion.rankingLocalidad.map((r, idx) => {
                    const wPct = Math.max(2, Math.round((r.i / maxRank) * 100));
                    // Verde para localidades con más intervenciones, amarillo para las intermedias y gris para el resto
                    const barColor = idx < 6 ? '#16A34A' : idx < 13 ? '#EAB308' : '#94A3B8';
                    const numColor = idx < 6 ? '#15803D' : idx < 13 ? '#A16207' : '#475569';
                    return (
                      <tr key={r.loc} style={{ background: idx % 2 === 1 ? '#F9FAFB' : '#FFFFFF', borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '8px 12px', color: '#6B7280', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1F2937' }}>{r.loc}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ flex: '1 1 0', height: '12px', background: '#F3F4F6', borderRadius: '3px', overflow: 'hidden', display: 'block' }}>
                              <span style={{ display: 'block', width: `${wPct}%`, height: '100%', background: barColor }} />
                            </span>
                            <span style={{ flex: '0 0 40px', textAlign: 'right', fontWeight: 700, color: numColor, fontFamily: 'Archivo, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                              {nf(r.i)}
                            </span>
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{nf(r.p)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#4B5563', fontFamily: 'Archivo, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                          {r.t > 0 ? `${nf(r.t, r.t % 1 !== 0 ? 1 : 0)} m³` : '—'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#4B5563', fontFamily: 'Archivo, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{nf(r.camb)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#4B5563', fontFamily: 'Archivo, system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{nf(r.m2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ============ 5 · SOSTENIMIENTO DE LOS 60 PUNTOS PRIORIZADOS (P04) ============ */}
        <div id="p04-sostenimiento" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              gap: '12px',
              borderBottom: '2px solid #16A34A',
              paddingBottom: '8px',
            }}
          >
            <h3 style={{ margin: 0, fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '19px', fontWeight: 700, color: '#1F2937' }}>
              5 · Sostenibilidad de los 60 puntos críticos priorizados (P04)
            </h3>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              Verificación en terreno del sostenimiento de las intervenciones en puntos priorizados T1 y T2
            </span>
          </div>

          {/* Anotación visual y muy clara del cálculo del ISP (Índice de Sostenibilidad del Punto) */}
          <div
            style={{
              border: '1px solid #BBF7D0',
              borderLeft: '5px solid #16A34A',
              borderRadius: '8px',
              padding: '16px 20px',
              background: '#F0FDF4',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#16A34A', color: '#FFFFFF', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif', letterSpacing: '.05em' }}>
                  FÓRMULA ISP
                </span>
                <strong style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '14.5px', color: '#166534' }}>
                  ¿Cómo se calcula el Índice de Sostenibilidad del Punto (ISP)?
                </strong>
              </div>
              <span style={{ fontSize: '12px', color: '#15803D', fontWeight: 700, fontFamily: 'Archivo, system-ui, sans-serif' }}>
                Escala de 0 a 100 puntos
              </span>
            </div>

            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#14532D', lineHeight: 1.5 }}>
              El <strong>ISP</strong> mide objetivamente la condición de cada punto combinando dos componentes ponderados:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3">
              <div style={{ background: '#FFFFFF', border: '1px solid #DCFCE7', borderRadius: '6px', padding: '12px 14px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    1 · Calificación en Territorio (Equipo EP - SGL)
                  </span>
                  <span style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '20px', fontWeight: 700, color: '#16A34A' }}>
                    70%
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.45 }}>
                  Puntajes cerrados según el estado asignado por el verificador:
                  <div style={{ marginTop: '7px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', fontFamily: 'Archivo, system-ui, sans-serif', border: '1px solid #BBF7D0' }}>
                      Sostenido: 100 pts <span style={{ opacity: 0.8, fontWeight: 500 }}>(aporta 70)</span>
                    </span>
                    <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', fontFamily: 'Archivo, system-ui, sans-serif', border: '1px solid #FDE68A' }}>
                      En riesgo: 70 pts <span style={{ opacity: 0.8, fontWeight: 500 }}>(aporta 49)</span>
                    </span>
                    <span style={{ background: '#FEE2E2', color: '#991B1B', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', fontFamily: 'Archivo, system-ui, sans-serif', border: '1px solid #FECACA' }}>
                      Recaída: 30 pts <span style={{ opacity: 0.8, fontWeight: 500 }}>(aporta 21)</span>
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #DCFCE7', borderRadius: '6px', padding: '12px 14px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    2 · Criterios Físicos Observables
                  </span>
                  <span style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '20px', fontWeight: 700, color: '#16A34A' }}>
                    30%
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.45 }}>
                  Verificación física estructurada en terreno:
                  <div style={{ marginTop: '5px', fontSize: '11.5px', color: '#4B5563', lineHeight: 1.45 }}>
                    <p style={{ margin: '0 0 4px 0' }}>
                      <strong>P04 Residuos (5 criterios · 6 pts c/u = 30 pts):</strong> Libre de residuos acumulados, Sin nuevo arrojo, Sin disposición de RCD, Sin reguero ni dispersión y Limpieza aceptable.
                    </p>
                    <p style={{ margin: '0' }}>
                      <strong>P05 Espacio Público (6 criterios · 5 pts c/u = 30 pts):</strong> Punto libre de ocupación, Espacio recuperado adecuado, Apropiación comunitaria, Sin ventas informales, Sin parqueo indebido y Sin cambuches.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px dashed #86EFAC', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', color: '#14532D', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: '#15803D' }}>💡 Ejemplo práctico:</span>
              <span>
                Un punto en riesgo (<strong style={{ color: '#92400E' }}>70 base × 70% = 49 pts</strong>) que cumple 4 de 5 criterios de residuos (<strong style={{ color: '#15803D' }}>4 × 6 pts = 24 pts</strong>) obtiene un ISP final de <strong style={{ color: '#15803D', fontSize: '13px' }}>73 puntos</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Pie institucional de Gestión P04 */}
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', fontSize: '12px', color: '#6B7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontWeight: 600 }}>SDG Unidad de Transformación - Subsecretaría de Gestión Local Grupo de Espacio Público</span>
          <span>Tablero de Gestión de Intervenciones · Residuos P04</span>
        </div>
      </div>
    </div>
  );
}

interface ModalFocalizadoProps {
  punto: PuntoFocalizadoOct;
  onClose: () => void;
}

export function ModalPuntoFocalizadoOct({ punto, onClose }: ModalFocalizadoProps) {
  const [generandoPdf, setGenerandoPdf] = useState(false);

  const getIconForTipo = (tipo: string) => {
    const t = tipo.toLowerCase();
    if (t.includes('ivc') || t.includes('control')) return <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />;
    if (t.includes('sensibilizaci') || t.includes('pedagog')) return <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />;
    return <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />;
  };

  const exportarPdfCarta = async () => {
    const el = document.getElementById('ficha-focalizado-imprimible-carta');
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
      const fileName = `Ficha_UAESP_Focalizado_${punto.ld}_${punto.uaespId}.pdf`.replace(/\s+/g, '_');
      pdf.save(fileName);
    } catch (err) {
      console.error('Error generando PDF de punto focalizado:', err);
      alert('Hubo un error al generar el PDF. Por favor utiliza la opción de Imprimir.');
    } finally {
      setGenerandoPdf(false);
    }
  };

  const imprimirCarta = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs"
      onClick={onClose}
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
          #ficha-focalizado-imprimible-carta, #ficha-focalizado-imprimible-carta * {
            visibility: visible !important;
          }
          #ficha-focalizado-imprimible-carta {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            background: #ffffff !important;
          }
          .no-imprimir {
            display: none !important;
          }
        }
      `}</style>
      <div
        className="bg-white rounded-xl max-w-4xl w-full shadow-2xl border border-purple-200 overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera morada distintiva de Punto en Confirmación UAESP */}
        <div
          style={{
            background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
            color: '#FFFFFF',
            padding: '18px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ minWidth: 0, flex: '1 1 320px' }}>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <span>🗑️👁️ Punto en confirmación UAESP · Acción Focalizada Octubre 2026</span>
            </div>
            <h2 style={{ margin: '2px 0 0', fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}>
              {punto.d}
            </h2>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.85 }}>
                ID UAESP
              </div>
              <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '20px', fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
                {punto.uaespId}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '10px', letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.85 }}>
                Localidad
              </div>
              <div style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontSize: '17px', fontWeight: 700, lineHeight: 1.3 }}>
                {punto.ld}
              </div>
            </div>
            <div className="flex items-center gap-2 no-imprimir">
              <button
                type="button"
                onClick={exportarPdfCarta}
                disabled={generandoPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-purple-900 hover:bg-purple-50 transition-colors shadow-xs cursor-pointer"
                title="Descargar ficha en PDF tamaño carta"
              >
                {generandoPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-700" /> : <Download className="w-3.5 h-3.5 text-purple-700" />}
                <span>{generandoPdf ? 'Generando...' : 'Exportar PDF (Carta)'}</span>
              </button>
              <button
                type="button"
                onClick={imprimirCarta}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                title="Imprimir ficha tamaño carta"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                title="Cerrar pestaña"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Cuerpo imprimible de la ficha */}
        <div id="ficha-focalizado-imprimible-carta" className="p-6 overflow-y-auto space-y-6">
          {/* Encabezado institucional para impresión / exportación */}
          <div className="border-b border-purple-200 pb-3 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                Alcaldía Mayor de Bogotá · Secretaría Distrital de Gobierno
              </div>
              <div className="text-xs text-gray-600 font-semibold">
                SDG Unidad de Transformación - Subsecretaría de Gestión Local Grupo de Espacio Público
              </div>
              <div className="text-[11px] text-gray-500">
                Ficha Técnica de Acción Focalizada UAESP · Octubre 2026
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
                UAESP: {punto.uaespId} · {punto.ld}
              </span>
            </div>
          </div>

          {/* Bloque superior: Problemática y Responsable */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-purple-50/60 border border-purple-200 rounded-lg p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-900 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-purple-700" />
                Problemática diagnosticada en el punto crítico
              </div>
              <p className="text-sm text-gray-800 leading-relaxed m-0">
                {punto.problematica}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-gray-700" />
                  Responsable Alcaldía Local
                </div>
                <div className="text-sm font-bold text-gray-900">{punto.responsable || 'Referente Ambiental Alcaldía Local'}</div>
                <div className="text-xs text-gray-600 mt-1 break-all">{punto.contacto || '—'}</div>
              </div>

              <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                <span className="text-gray-500">Estado en ficha:</span>
                <span className="font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                  {punto.estadoSeleccion || 'Confirmado en ficha oficial'}
                </span>
              </div>
            </div>
          </div>

          {/* Bloque central: Acciones previstas y programadas en Octubre 2026 */}
          <div>
            <h3
              style={{
                margin: '0 0 12px',
                fontFamily: 'Archivo, system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: '#1F2937',
                paddingBottom: '6px',
                borderBottom: '2px solid #7C3AED',
              }}
            >
              Acciones previstas y cronograma de intervención ({punto.acciones.length} acciones programadas)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {punto.acciones.map((acc, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 bg-white shadow-2xs hover:border-purple-300 transition-colors flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 font-bold text-xs text-gray-900 uppercase tracking-wide">
                        {getIconForTipo(acc.tipo)}
                        <span>{acc.tipo}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-900 shrink-0">
                        <Calendar className="w-3 h-3" />
                        {acc.fechas}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed m-0">
                      {acc.actividad}
                    </p>
                  </div>
                  {acc.observacion && acc.observacion.trim().length > 0 && !/sin x|plantilla|ejemplo|casilla/i.test(acc.observacion) && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1">
                      Nota: {acc.observacion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Puntos disponibles en la ficha territorial de la localidad */}
          {punto.puntosFicha && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 text-xs text-gray-600">
              <strong className="text-gray-800 block mb-1">
                Puntos críticos en confirmación UAESP evaluados en la ficha de {punto.ld}:
              </strong>
              <span>{punto.puntosFicha}</span>
            </div>
          )}

          {/* Pie institucional de página */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
            <span>SDG Unidad de Transformación - Subsecretaría de Gestión Local Grupo de Espacio Público</span>
            <span>Documento Oficial de Monitoreo · Bogotá D.C.</span>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-gray-500">
            SDG Unidad de Transformación - Subsecretaría de Gestión Local Grupo de Espacio Público · Base de Intervenciones Octubre 2026 ({punto.ld})
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportarPdfCarta}
              disabled={generandoPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 transition-colors cursor-pointer shadow-xs"
            >
              {generandoPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{generandoPdf ? 'Generando...' : 'Exportar PDF (Carta)'}</span>
            </button>
            <button
              type="button"
              onClick={imprimirCarta}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gray-800 text-white hover:bg-black transition-colors cursor-pointer"
            >
              Cerrar pestaña
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
