import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  ultimaFicha: any;
}

export default function FichasDecoradas({ ultimaFicha }: Props) {
  if (!ultimaFicha) return null;

  const getAvancePct = (real: number | undefined, prog: number | undefined): number => {
    if (!prog || prog === 0) return 0;
    return Math.round(((real || 0) / prog) * 100);
  };

  const getStatusColor = (real: number | undefined, prog: number | undefined): string => {
    if (!prog || prog === 0) return '#6b7280';
    const pct = getAvancePct(real, prog);
    if (pct < 50) return '#dc2626';
    if (pct < 80) return '#d97706';
    return '#16a34a';
  };

  const parseVinetas = (texto: string | null | undefined) => {
    if (!texto || texto.trim().length === 0) return null;
    const lineas = texto.split('\n').filter((l: string) => l.trim().length > 0);
    return (
      <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
        {lineas.map((l: string, i: number) => <li key={i}>{l.replace(/^[-*.\s]*/, '')}</li>)}
      </ul>
    );
  };

  const renderGauge = (
    real: number | undefined,
    prog: number | undefined,
    meta: number | undefined,
    color: string,
    unit: string = ''
  ) => {
    const safeReal = real ?? 0;
    const safeProg = prog ?? 0;
    const safeMeta = meta ?? 0;
    let fillPct = 0;
    let needlePct = 0;
    if (safeMeta > 0) {
      fillPct   = Math.min(100, (safeReal / safeMeta) * 100);
      needlePct = Math.min(100, (safeProg / safeMeta) * 100);
    } else if (safeProg > 0) {
      fillPct   = Math.min(100, (safeReal / safeProg) * 100);
      needlePct = 100;
    }
    const data = [
      { value: fillPct,                    color },
      { value: Math.max(0, 100 - fillPct), color: '#e5e7eb' },
    ];

    const GaugeNeedle = ({ pct }: { pct: number }) => {
      const rotateDeg = (pct * 180 / 100) - 90;
      const theta = rotateDeg * Math.PI / 180;
      const tx = Math.sin(theta) * 52;
      const ty = -Math.cos(theta) * 52;
      return (
        <div className="absolute z-10 w-full h-full pointer-events-none" style={{ bottom: 0, left: 0 }}>
          <div style={{
            position: 'absolute', bottom: 0, left: '50%',
            width: '2px', height: '58px',
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${rotateDeg}deg)`,
            borderLeft: '2px dashed #374151',
          }} />
          {prog !== undefined && prog !== null && (
            <div className="absolute whitespace-nowrap bg-gray-700 text-white text-[9px] font-bold px-1 py-0.5 rounded shadow"
              style={{ left: `calc(50% + ${tx}px)`, bottom: `${-ty}px`, transform: 'translate(-50%, -50%)' }}>
              {prog}{unit} Prog.
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="flex flex-col items-center">
        <div className="relative h-20 w-32 mx-auto mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="100%" startAngle={180} endAngle={0}
                innerRadius={35} outerRadius={55} paddingAngle={0} dataKey="value" stroke="none">
                {data.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {(safeMeta > 0 || safeProg > 0) && <GaugeNeedle pct={needlePct} />}
          <div className="absolute bottom-0 left-0 w-full text-center" style={{ marginBottom: '-8px' }}>
            <span className="text-xl font-black" style={{ color }}>{Math.round(fillPct)}%</span>
          </div>
        </div>
        <div className="mt-5">
          {meta !== undefined && meta !== null ? (
            <span className="inline-block bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
              Meta anual: {meta}{unit}
            </span>
          ) : (
            <span className="inline-block bg-red-50 border border-red-200 text-red-500 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
              Meta anual no reportada
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderObrasBar = (meta: number | undefined, prog: number | undefined, real: number | undefined) => {
    const safeMeta = meta ?? 0;
    const safeProg = prog ?? 0;
    const safeReal = real ?? 0;
    const realPct  = safeMeta > 0 ? Math.min(100, (safeReal / safeMeta) * 100) : 0;
    const progPct  = safeMeta > 0 ? Math.min(100, (safeProg / safeMeta) * 100) : 0;
    const gapPct   = Math.max(0, progPct - realPct);
    const statusColor = getStatusColor(safeReal, safeProg);
    return (
      <div className="w-full mt-2">
        <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-1 px-0.5">
          <span style={{ color: '#16a34a' }}>Ejecutado: {safeReal.toLocaleString('es-CO')}</span>
          {safeProg > 0 && <span style={{ color: '#d97706' }}>Prog. corte: {safeProg.toLocaleString('es-CO')}</span>}
          <span className="text-gray-400">Meta: {safeMeta.toLocaleString('es-CO')}</span>
        </div>
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-200 relative">
          <div style={{ width: `${realPct}%`, backgroundColor: '#16a34a', minWidth: realPct > 0 ? '2px' : '0' }} className="h-full" />
          <div style={{ width: `${gapPct}%`, backgroundColor: '#fbbf24', minWidth: gapPct > 0 ? '2px' : '0' }} className="h-full" />
          <div className="h-full flex-1 bg-gray-200" />
          {safeProg > 0 && safeMeta > 0 && (
            <div className="absolute top-0 h-full w-0.5 bg-gray-600" style={{ left: `${progPct}%` }} />
          )}
        </div>
        <div className="flex justify-between text-[9px] mt-1 px-0.5">
          <span style={{ color: statusColor }}>
            {safeProg > 0 ? `${getAvancePct(safeReal, safeProg)}% vs programado` : 'Prog. al corte no reportado'}
          </span>
          <span className="text-gray-400">{safeMeta > 0 ? `${Math.round(realPct)}% de meta anual` : ''}</span>
        </div>
      </div>
    );
  };

  const renderCard = (
    title: string,
    headerColor: string,
    children: React.ReactNode,
    avances: string | null | undefined,
    alertas: string | null | undefined
  ) => (
    <div className="rounded-xl overflow-hidden shadow-sm border-2 flex flex-col"
      style={{ borderColor: headerColor, breakInside: 'avoid', marginBottom: '1.5rem' }}>
      <h3 className="text-white text-center font-bold text-base py-2 uppercase tracking-wide flex items-center justify-center gap-2 shrink-0"
        style={{ backgroundColor: headerColor }}>
        {title}
      </h3>
      <div className="bg-white p-4 flex flex-col flex-1">
        <div className="flex-1 pb-2">{children}</div>
        <div className="mt-3 border border-green-400 rounded-lg overflow-hidden shrink-0">
          <div className="bg-green-50 text-green-800 text-[10px] font-bold px-3 py-1 border-b border-green-200">
            PRINCIPALES AVANCES DEL CORTE
          </div>
          <div className="p-2 bg-white min-h-[44px]">
            {avances && avances.trim().length > 0
              ? parseVinetas(avances)
              : <p className="text-[10px] text-gray-300 italic">No reportado aun</p>}
          </div>
        </div>
        <div className="mt-2 border border-red-300 rounded-lg overflow-hidden shrink-0">
          <div className="bg-red-50 text-red-700 text-[10px] font-bold px-3 py-1 border-b border-red-200">
            ALERTAS
          </div>
          <div className="p-2 bg-white min-h-[44px]">
            {alertas && alertas.trim().length > 0
              ? <p className="text-xs text-gray-700 font-medium whitespace-pre-wrap">{alertas}</p>
              : <p className="text-[10px] text-gray-300 italic">No reportado aun</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const c1Color        = getStatusColor(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct);
  const c2Color        = getStatusColor(ultimaFicha.girosPct, ultimaFicha.metaGirosPct);
  const ejecucionColor = c1Color === '#dc2626' || c2Color === '#dc2626' ? '#dc2626'
                       : c1Color === '#d97706' || c2Color === '#d97706' ? '#d97706' : '#16a34a';
  const obrasColor     = getStatusColor(ultimaFicha.intervencionesFinalizadas, ultimaFicha.obrasProgramadasAlCorte);
  const rollosColor    = getStatusColor(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte);
  const residColor     = getStatusColor(ultimaFicha.puntosSostenidos, ultimaFicha.puntosSostenidosProgramados);
  const orgColor       = getStatusColor(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad);
  const archColor      = getStatusColor(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte);
  const fallosColor    = getStatusColor(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte);
  const actColor       = archColor === '#dc2626' || fallosColor === '#dc2626' ? '#dc2626'
                       : archColor === '#d97706' || fallosColor === '#d97706' ? '#d97706' : '#16a34a';
  const motosReal      = (ultimaFicha.motosEntregadasPolicia || 0) + (ultimaFicha.motosEntregadas || 0);
  const convColor      = getStatusColor(motosReal, ultimaFicha.motosProgramadasCorte);
  const memColor       = getStatusColor(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte);

  const renderHeader = () => (
    <div className="flex justify-between items-start mb-6 border-b-4 border-red-600 pb-2">
      <div>
        <h1 className="text-4xl font-extrabold text-[#1a3622] tracking-tighter uppercase">Transformacion Local</h1>
        <h2 className="text-2xl font-light text-gray-500">Unidad de Transformacion</h2>
      </div>
      <img src="/Logo_sede_electronica_SDG.png" alt="Alcaldia de Bogota" className="h-10 object-contain" />
    </div>
  );

  return (
    <div className="w-full bg-gray-100 font-sans p-4 flex flex-col gap-4">

      {/* PAGE 1 */}
      <div className="pdf-page bg-white w-[210mm] min-h-[297mm] mx-auto p-8 shadow-md relative">
        {renderHeader()}
        <div className="grid grid-cols-2 gap-6">

          {renderCard('1. EJECUCION PRESUPUESTAL', ejecucionColor, (
            <div className="flex justify-around items-start mt-2 gap-2">
              <div className="text-center flex-1">
                <span className="font-bold text-xs block mb-1 text-gray-700">COMPROMISOS</span>
                {renderGauge(ultimaFicha.compromisosPct, ultimaFicha.metaCompromisosPct, 100, c1Color, '%')}
              </div>
              <div className="text-center flex-1">
                <span className="font-bold text-xs block mb-1 text-gray-700">GIROS</span>
                {renderGauge(ultimaFicha.girosPct, ultimaFicha.metaGirosPct, 100, c2Color, '%')}
              </div>
            </div>
          ), ultimaFicha.avancesEjecucion, ultimaFicha.alertaEjecucion)}

          {renderCard('2. OBRAS LOCALES', obrasColor, (
            <div>
              <div className="grid grid-cols-3 gap-2 text-center border-b pb-2 mb-1">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block leading-tight">META<br/>ANUAL</span>
                  <span className="text-xl font-black">{(ultimaFicha.metaObras || 0).toLocaleString('es-CO')}</span>
                </div>
                <div className="border-x border-gray-100">
                  <span className="text-[10px] text-gray-500 font-bold block leading-tight">PROG. AL<br/>CORTE</span>
                  {ultimaFicha.obrasProgramadasAlCorte == null
                    ? <span className="block text-red-500 text-[10px] font-bold mt-1">No reportado</span>
                    : <span className="text-xl font-black">{Number(ultimaFicha.obrasProgramadasAlCorte).toLocaleString('es-CO')}</span>}
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block leading-tight">FINALIZ.<br/>(REAL)</span>
                  <span className="text-xl font-black" style={{ color: obrasColor }}>
                    {(ultimaFicha.intervencionesFinalizadas || 0).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
              {renderObrasBar(ultimaFicha.metaObras, ultimaFicha.obrasProgramadasAlCorte, ultimaFicha.intervencionesFinalizadas)}
              <div className="grid grid-cols-2 gap-3 text-center mt-3">
                <div className="border border-gray-100 bg-gray-50 rounded-lg p-2">
                  <span className="text-[10px] text-gray-500 font-bold block">KM CARRIL INTERVENIDO</span>
                  <span className="text-xl font-black">{ultimaFicha.kmCarrilIntervenido || 0}</span>
                </div>
                <div className="border border-gray-100 bg-gray-50 rounded-lg p-2">
                  <span className="text-[10px] text-gray-500 font-bold block">M2 INTERVENIDOS</span>
                  <span className="text-xl font-black">{ultimaFicha.kmIntervenidos?.toLocaleString('es-CO') || 0}</span>
                </div>
              </div>
            </div>
          ), ultimaFicha.avancesObras, ultimaFicha.alertaObras)}

          {renderCard('3. ROLLOS LEGENDARIOS', rollosColor, (
            <div className="flex items-start gap-4 mt-1">
              <div className="text-center shrink-0 w-36">
                {renderGauge(ultimaFicha.rollosResueltos, ultimaFicha.rollosProgramadosAlCorte, ultimaFicha.totalRollos, rollosColor)}
              </div>
              <div className="flex-1 space-y-1.5 mt-1">
                {[
                  { label: 'Total rollos',           val: ultimaFicha.totalRollos },
                  { label: 'Resueltos (real)',        val: ultimaFicha.rollosResueltos,            color: rollosColor },
                  { label: 'Avances significativos', val: ultimaFicha.rollosAvancesSignificativos },
                  { label: 'En curso',               val: ultimaFicha.rollosEnCurso },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex justify-between items-center border-b border-gray-100 pb-1">
                    <span className="text-xs font-bold text-gray-500">{label}</span>
                    <span className="text-lg font-black" style={color ? { color } : {}}>{val || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          ), ultimaFicha.avancesRollos, ultimaFicha.alertaRollos)}

          {renderCard('4. ESPACIO PUBLICO - RESIDUOS', residColor, (
            <div>
              <div className="grid grid-cols-2 gap-4 text-center border-b border-gray-100 pb-2 mb-2">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block uppercase leading-tight">Puntos Criticos<br/>Priorizados</span>
                  <span className="text-2xl font-black">{ultimaFicha.puntosCriticosPriorizados || 0}</span>
                </div>
                <div className="border-l border-gray-100">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase leading-tight">Puntos sostenidos<br/>(Real)</span>
                  <span className="text-2xl font-black" style={{ color: residColor }}>{ultimaFicha.puntosSostenidos || 0}</span>
                </div>
              </div>
              <div className="flex justify-between text-[9px] font-bold mb-1 px-1">
                <span className="text-gray-400">0%</span>
                <span style={{ color: residColor }}>{getAvancePct(ultimaFicha.puntosSostenidos, ultimaFicha.puntosSostenidosProgramados)}% vs programado</span>
                <span className="text-gray-400">100%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, getAvancePct(ultimaFicha.puntosSostenidos, ultimaFicha.puntosSostenidosProgramados))}%`, backgroundColor: residColor }} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  { label: 'Personas sensibilizadas', val: ultimaFicha.personasSensibilizadas },
                  { label: 'Operativos IVC',          val: ultimaFicha.operativosIVC },
                  { label: 'Intervenciones rep.',     val: ultimaFicha.accionesReportadas },
                  { label: 'M3 recolectados',         val: ultimaFicha.residuosM3 },
                ].map(({ label, val }) => (
                  <div key={label} className="border border-gray-100 bg-gray-50 p-1.5 rounded flex justify-between items-center">
                    <span className="text-gray-500 font-bold">{label}</span>
                    <span className="font-black text-sm">{val?.toLocaleString('es-CO') ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          ), ultimaFicha.avancesResiduos, ultimaFicha.alertaEspacioResiduos)}

        </div>
      </div>

      {/* PAGE 2 */}
      <div className="pdf-page bg-white w-[210mm] min-h-[297mm] mx-auto p-8 shadow-md">
        {renderHeader()}
        <div className="grid grid-cols-2 gap-6">

          <div className="col-span-2">
            {renderCard('5. ORGANIZACION Y RECUPERACION ESPACIO PUBLICO', orgColor, (
              <div className="grid grid-cols-3 gap-6 items-start">
                <div className="text-center border-r border-gray-100 pr-4">
                  <span className="text-[10px] font-bold text-gray-500 block uppercase mb-1">Puntos con Sostenibilidad Efectiva</span>
                  {renderGauge(ultimaFicha.puntosSostenibilidadEfectiva, ultimaFicha.puntosProgramadosSostenibilidad, ultimaFicha.puntosVerificados, orgColor)}
                </div>
                <div className="text-center border-r border-gray-100 pr-4">
                  <span className="text-[10px] font-bold text-gray-500 block uppercase mb-2">Distribucion Operativos</span>
                  <div className="h-20 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { value: ultimaFicha.orgParqueo || 0, color: '#f59e0b' },
                          { value: ultimaFicha.ventaInformal || 0, color: '#dc2626' },
                        ]} innerRadius={20} outerRadius={35} dataKey="value" stroke="none">
                          {[{ color: '#f59e0b' }, { color: '#dc2626' }].map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-around text-[10px] font-bold mt-1">
                    <div className="text-yellow-600">Parqueo: {ultimaFicha.orgParqueo || 0}</div>
                    <div className="text-red-600">Venta inf.: {ultimaFicha.ventaInformal || 0}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Puntos verificados',  val: ultimaFicha.puntosVerificados },
                    { label: 'Intervenciones rep.', val: ultimaFicha.puntosIntervenidos },
                    { label: 'M2 recuperados',      val: ultimaFicha.m2RecuperadosInformal },
                    { label: 'Personas reubicadas', val: ultimaFicha.personasReubicadas },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between items-center border-b border-gray-100 pb-1">
                      <span className="text-xs font-bold text-gray-500">{label}</span>
                      <span className="font-black text-lg">{val?.toLocaleString('es-CO') ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            ), ultimaFicha.avancesVenta, ultimaFicha.alertaEspacioVenta)}
          </div>

          {renderCard('6. ACTUACIONES ADMINISTRATIVAS', actColor, (
            <div className="flex justify-around items-start gap-4 mt-1">
              <div className="text-center flex-1">
                <span className="font-bold text-xs block mb-1 text-gray-700">ARCHIVOS</span>
                {renderGauge(ultimaFicha.archivosPct, ultimaFicha.archivosProgramadosCorte, ultimaFicha.metaArchivos, archColor)}
              </div>
              <div className="text-center flex-1">
                <span className="font-bold text-xs block mb-1 text-gray-700">FALLOS 1a INSTANCIA</span>
                {renderGauge(ultimaFicha.fallosPrimeraEstanciaPct, ultimaFicha.fallosProgramadosCorte, ultimaFicha.metaFallos, fallosColor)}
              </div>
            </div>
          ), ultimaFicha.avancesActuaciones, ultimaFicha.alertaActuaciones)}

          {renderCard('7. CONVIVENCIA Y SEGURIDAD', convColor, (
            <div>
              <div className="grid grid-cols-2 gap-4 text-center border-b border-gray-100 pb-2 mb-3">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block uppercase leading-tight">Motos prog.<br/>al corte</span>
                  {ultimaFicha.motosProgramadasCorte == null
                    ? <span className="block text-red-500 text-[10px] mt-1 font-bold">No reportado</span>
                    : <span className="text-2xl font-black">{ultimaFicha.motosProgramadasCorte}</span>}
                </div>
                <div className="border-l border-gray-100">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase leading-tight">Avance entrega<br/>(Real)</span>
                  <span className="text-2xl font-black" style={{ color: convColor }}>
                    {getAvancePct(motosReal, ultimaFicha.motosProgramadasCorte)}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[9px] mb-2">
                {[
                  { label: 'Entregadas Policia', val: ultimaFicha.motosEntregadasPolicia, dot: '#16a34a' },
                  { label: 'Entregadas SDSCJ',   val: ultimaFicha.motosEntregadas,        dot: '#f59e0b' },
                  { label: 'Almacen FDL',        val: ultimaFicha.motosAlmacenFdl,        dot: '#92400e' },
                  { label: 'Pendientes FDL',     val: ultimaFicha.motosPendientesFdl,     dot: '#9ca3af' },
                ].map(({ label, val, dot }) => (
                  <div key={label} className="border border-gray-100 bg-gray-50 p-1 rounded flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                      <span className="text-gray-500 font-medium">{label}</span>
                    </div>
                    <span className="font-bold text-sm">{val || 0}</span>
                  </div>
                ))}
              </div>
              <div className="text-center text-[10px] text-gray-400 font-medium border-t border-gray-100 pt-1">
                Meta Total: {ultimaFicha.motosMetaTotal || 0} motos
              </div>
            </div>
          ), ultimaFicha.avancesConvivencia, ultimaFicha.alertaConvivencia)}

          <div className="col-span-2">
            {renderCard('8. ESTRATEGIAS DE MEMORIA', memColor, (
              <div className="flex items-start gap-6">
                <div className="text-center shrink-0 w-36">
                  {renderGauge(ultimaFicha.estrategiasResueltas, ultimaFicha.estrategiasProgramadasCorte, ultimaFicha.estrategiasTotal, memColor)}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-2 mt-1">
                  {[
                    { label: 'Total estrategias',     val: ultimaFicha.estrategiasTotal },
                    { label: 'Finalizadas (real)',     val: ultimaFicha.estrategiasResueltas,         color: memColor },
                    { label: 'En formulacion',        val: ultimaFicha.estrategiasFormulacion },
                    { label: 'En validacion tecnica', val: ultimaFicha.estrategiasValidacionTecnica },
                    { label: 'Con ajustes solic.',    val: ultimaFicha.estrategiasAjustes },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="flex justify-between items-center border-b border-gray-100 pb-1">
                      <span className="text-xs font-bold text-gray-500">{label}</span>
                      <span className="text-lg font-black" style={color ? { color } : {}}>{val || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            ), ultimaFicha.avancesEstrategias, ultimaFicha.alertaEstrategias)}
          </div>

        </div>
      </div>
    </div>
  );
}
