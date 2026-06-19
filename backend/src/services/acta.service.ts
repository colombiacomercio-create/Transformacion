

import https from 'https';
import http from 'http';

// Descarga una URL como Buffer
function fetchBuffer(url: string): Promise<Buffer> {
  // Hack para que Vercel (@vercel/nft) empaquete estos módulos ESM en la lambda
  if (process.env.VERCEL_FORCE_INCLUDE === 'true') {
    require('puppeteer-core');
    require('@sparticuz/chromium-min');
  }
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, res => {
      const chunks: Buffer[] = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

export interface AsistenteData {
  nombre: string;
  cargo?: string;
  entidad?: string;
}

export interface CompromisoData {
  descripcion: string;
  responsable: string;
  fechaEntrega?: string | null;
}

export interface ActaData {
  objeto: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  lugar: string;
  modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'TELEFONICA' | 'MIXTA';
  dependencia?: string;
  responsable: string;
  asistentes: AsistenteData[];
  imagenAsistenciaUrl?: string | null;
  desarrollo: string;
  compromisos: CompromisoData[];
}

const HABEAS_DATA = `Quien registra sus datos, conforme a la Ley 1581 de 2012 y demás normas reglamentarias aplicables, declara que conoce y acepta la Política de Tratamiento y Protección de Datos Personales de la Secretaría Distrital de Gobierno, y que la información proporcionada es veraz, completa, exacta, actualizada y verificable. Reconoce y acepta que cualquier consulta o reclamación relacionada con el tratamiento de sus datos personales podrá ser elevada verbalmente o por escrito ante la Secretaría Distrital de Gobierno – Oficina de Atención al Ciudadano, como responsable del tratamiento; cuya página web es www.gobiernobogota.gov.co y su teléfono de atención es 3387000. Manifiesta que con los datos proporcionados tiene el derecho de conocer, actualizar y rectificar los datos personales, a solicitar prueba de este consentimiento, a solicitar información sobre el uso que se le ha dado a los datos personales, a presentar quejas ante la Superintendencia de Industria y Comercio por el uso indebido de los datos personales, a revocar esta autorización o solicitar la supresión de los datos personales suministrados y a acceder de forma gratuita a los mismos. De igual manera entiende que los datos aquí consignados serán usados para temas estadísticos, de caracterización poblacional y en determinados casos para el acceso a la oferta institucional de la Secretaría Distrital de Gobierno.`;

function formatFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// Logo con tabla anidada — técnica más confiable en Puppeteer/Chromium
// La tabla interna apila ★ encima de A sin depender de position:absolute ni flexbox
function logoHtml(): string {
  return `<table style="border:none;border-collapse:collapse;margin:0 auto;">
  <tr>
    <td style="border:none;padding:0;font-family:'Arial Black',Arial,sans-serif;font-weight:900;font-size:26pt;line-height:1;vertical-align:bottom;white-space:nowrap;">BOGOT</td>
    <td style="border:none;padding:0;vertical-align:bottom;">
      <table style="border:none;border-collapse:collapse;margin:0;padding:0;">
        <tr><td style="border:none;padding:0 0 1px 0;text-align:center;font-family:Arial,sans-serif;font-size:10pt;font-weight:bold;line-height:1;">&#9733;</td></tr>
        <tr><td style="border:none;padding:0;font-family:'Arial Black',Arial,sans-serif;font-weight:900;font-size:26pt;line-height:1;">A</td></tr>
      </table>
    </td>
    <td style="border:none;border-left:2px solid #000;padding:0 6px;vertical-align:middle;">&nbsp;</td>
    <td style="border:none;padding:0;vertical-align:middle;">
      <div style="font-family:Arial,sans-serif;font-size:7.5pt;font-weight:400;white-space:nowrap;line-height:1.5;">SECRETAR&#205;A DE</div>
      <div style="font-family:Arial,sans-serif;font-size:13pt;font-weight:700;white-space:nowrap;line-height:1.1;">GOBIERNO</div>
    </td>
  </tr>
</table>`;
}

function buildHtml(data: ActaData): string {
  const X = (m: string) => data.modalidad === m
    ? '<b>X</b>'
    : '&nbsp;';

  const compromisosRows = data.compromisos.length > 0
    ? data.compromisos.map((c, i) => `
        <tr>
          <td style="text-align:center;height:22px;">${i + 1}</td>
          <td>${c.descripcion}</td>
          <td>${c.responsable}</td>
          <td style="text-align:center;">${c.fechaEntrega ? new Date(c.fechaEntrega).toLocaleDateString('es-CO') : ''}</td>
        </tr>`).join('')
    : Array(7).fill(null).map(() =>
        '<tr><td style="height:22px;"></td><td></td><td></td><td></td></tr>'
      ).join('');

  const imagenHtml = data.imagenAsistenciaUrl
    ? `<img src="${data.imagenAsistenciaUrl}" style="width:100%;height:100%;object-fit:contain;display:block;"/>`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:9pt;font-style:italic;">Evidencia de reuni&#243;n</div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  @page { size: A4 landscape; margin: 10mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 9pt; color: #000; }

  /* ── Tabla principal ── */
  table.main {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  table.main td, table.main th {
    border: 1px solid #000;
    padding: 4px 7px;
    vertical-align: middle;
  }

  /* ── Tabla compromisos ── */
  table.comp { width: 100%; border-collapse: collapse; }
  table.comp td, table.comp th {
    border: 1px solid #000;
    padding: 4px 6px;
    vertical-align: middle;
    font-size: 9pt;
  }

  /* ── Utilidades ── */
  .lbl   { font-weight: bold; font-size: 9pt; white-space: nowrap; }
  .val   { font-weight: bold; text-align: center; font-size: 9pt; }
  .code  { font-size: 7.5pt; vertical-align: top !important; padding: 4px 6px; line-height: 1.75; }
  .page-break { page-break-before: always; }
  .sec   { font-weight: bold; font-size: 9pt; padding: 5px 6px; }
  .texto { padding: 8px; vertical-align: top; font-size: 9pt; white-space: pre-wrap; min-height: 290px; }
  .consent { font-size: 6.5pt; text-align: justify; line-height: 1.45; page-break-inside: avoid; break-inside: avoid; }

  /* Celda de imagen: altura fija, la imagen se escala dentro */
  .img-cell { padding:0 !important; height:310px !important; max-height:310px !important; overflow:hidden !important; }
  .img-wrap  { width:100%; height:310px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
  .img-wrap img { max-width:100%; max-height:310px; width:auto; height:auto; object-fit:contain; display:block; }
</style>
</head>
<body>

<!-- ══════════════ PÁGINA 1 ══════════════ -->
<table class="main">
  <colgroup>
    <col style="width:170px;"/><!-- c1: logo / label -->
    <col style="width:auto;"/> <!-- c2: value principal -->
    <col style="width:135px;"/><!-- c3: label hora -->
    <col style="width:78px;"/> <!-- c4: value hora -->
    <col style="width:158px;"/><!-- c5: modalidad / código -->
  </colgroup>

  <!-- Fila 1: [Logo + EVIDENCIA DE REUNIÓN en una sola celda sin borde interno] | Código -->
  <tr>
    <td colspan="4" style="padding:0;height:72px;">
      <table style="border:none;border-collapse:collapse;width:100%;height:100%;">
        <tr>
          <td style="border:none;padding:6px;width:170px;text-align:center;vertical-align:middle;">
            ${logoHtml()}
          </td>
          <td style="border:none;padding:10px 6px;text-align:center;vertical-align:middle;font-family:Arial,sans-serif;font-size:17pt;font-weight:bold;">
            EVIDENCIA DE REUNI&#211;N
          </td>
        </tr>
      </table>
    </td>
    <td class="code" style="vertical-align:top;">
      C&#243;digo: GDI-GPD-F029<br/>
      Versi&#243;n: 6<br/>
      Vigencia: 21 de agosto de 2024<br/>
      Caso HOLA: 70103
    </td>
  </tr>

  <!-- Fila 2: Objeto de la reunión -->
  <tr>
    <td class="lbl">Objeto de la reuni&#243;n:</td>
    <td colspan="4" class="val">${data.objeto}</td>
  </tr>

  <!-- Fila 3: Fecha | date | Hora inicio | time | Modalidad (rowspan=2) -->
  <tr style="height:36px;">
    <td class="lbl">Fecha:</td>
    <td class="val">${formatFecha(data.fecha)}</td>
    <td class="lbl">Hora de inicio:</td>
    <td class="val">${data.horaInicio}</td>
    <td rowspan="2" style="vertical-align:top;padding:4px 8px;">
      <div style="font-size:8.5pt;font-weight:bold;margin-bottom:3px;">Modalidad:</div>
      <table style="border:none;border-collapse:collapse;width:100%;">
        <tr><td style="border:none;border-bottom:1px solid #000;padding:2px 4px;font-size:8.5pt;">${X('PRESENCIAL')}&nbsp;&nbsp;Presencial</td></tr>
        <tr><td style="border:none;border-bottom:1px solid #000;padding:2px 4px;font-size:8.5pt;">${X('VIRTUAL')}&nbsp;&nbsp;Virtual</td></tr>
        <tr><td style="border:none;border-bottom:1px solid #000;padding:2px 4px;font-size:8.5pt;">${X('TELEFONICA')}&nbsp;&nbsp;Telef&#243;nica</td></tr>
        <tr><td style="border:none;border-bottom:1px solid #000;padding:2px 4px;font-size:8.5pt;">${X('MIXTA')}&nbsp;&nbsp;Mixta</td></tr>
      </table>
    </td>
  </tr>

  <!-- Fila 4: Lugar | place | Hora fin | time -->
  <tr style="height:36px;">
    <td class="lbl">Lugar:</td>
    <td class="val">${data.lugar || ''}</td>
    <td class="lbl">Hora de finalizaci&#243;n:</td>
    <td class="val">${data.horaFin}</td>
  </tr>

  <!-- Fila 5: Dependencia | Responsable -->
  <tr>
    <td class="lbl">Dependencia:</td>
    <td colspan="2" style="font-size:9pt;">${data.dependencia || 'Subsecretaria Gesti&#243;n Local - Unidad de Transformaci&#243;n'}</td>
    <td colspan="2" style="font-size:9pt;"><b>Nombre del Responsable:</b> ${data.responsable}</td>
  </tr>

  <!-- Fila 6: Área de imagen — altura fija, nunca se expande -->
  <tr>
    <td colspan="5" class="img-cell">
      <div class="img-wrap">
        ${imagenHtml}
      </div>
    </td>
  </tr>
</table>

<!-- Consentimiento HABEAS DATA — todo en página 1, sin salto de página interno -->
<div class="consent" style="margin-top:4px;">
  <b>CONSENTIMIENTO:</b> ${HABEAS_DATA}
</div>
<div class="consent" style="margin-top:2px;">
  * Ver SAC-M002 Manual de Atenci&#243;n Diferencial y Preferencial para personas con discapacidad, disponible en https://gaia.gobiernobogota.gov.co/content/sistema-integrado-de-gestion-sdg
</div>

<!-- ══════════════ PÁGINA 2 ══════════════ -->
<div class="page-break"></div>

<!-- Desarrollo y conclusiones -->
<table class="main">
  <tr><td class="sec">DESARROLLO Y CONCLUSIONES DE LA REUNI&#211;N:</td></tr>
  <tr><td class="texto">${data.desarrollo}</td></tr>
</table>

<!-- Compromisos -->
<table class="main" style="margin-top:12px;">
  <tr><td class="sec">COMPROMISOS DE LA REUNI&#211;N:</td></tr>
</table>
<table class="comp">
  <colgroup>
    <col style="width:38px;"/>
    <col style="width:auto;"/>
    <col style="width:150px;"/>
    <col style="width:130px;"/>
  </colgroup>
  <tr>
    <th style="text-align:center;">No.</th>
    <th style="text-align:center;">ACTIVIDAD</th>
    <th style="text-align:center;">RESPONSABLE</th>
    <th style="text-align:center;">FECHA DE ENTREGA</th>
  </tr>
  ${compromisosRows}
</table>

<div style="font-size:7.5pt;margin-top:8px;line-height:1.8;">
  NOTA 1: En caso de ser una reuni&#243;n virtual se puede anexar el reporte de asistencia generado por las plataformas de reuniones o plataformas que generen formularios.<br/>
  NOTA 2: Agregue o elimine las filas que sean necesarias para registrar los asistentes y los compromisos de la reuni&#243;n.
</div>

</body>
</html>`;
}

export function buildActaHtml(data: ActaData): string {
  return buildHtml(data);
}

export async function generarActaPDF(data: ActaData): Promise<Buffer> {
  // Si hay imagen remota, descargarla y convertir a data-URL base64
  // para que Puppeteer no haga fetch externo y podamos controlar el tamaño
  let dataResolved = data;
  if (data.imagenAsistenciaUrl && data.imagenAsistenciaUrl.startsWith('http')) {
    try {
      const imgBuf = await fetchBuffer(data.imagenAsistenciaUrl);
      const mime = data.imagenAsistenciaUrl.match(/\.(png)$/i) ? 'image/png' : 'image/jpeg';
      const b64 = imgBuf.toString('base64');
      dataResolved = { ...data, imagenAsistenciaUrl: `data:${mime};base64,${b64}` };
    } catch {
      // Si falla la descarga, usar URL original
    }
  }

  const html = buildHtml(dataResolved);
  // Importamos puppeteer-core dinámicamente porque es ESM
  const puppeteerMod = await new Function("return import('puppeteer-core')")();
  const puppeteer = puppeteerMod.default || puppeteerMod;

  const chromiumMod = await new Function("return import('@sparticuz/chromium-min')")();
  const chromium = chromiumMod.default || chromiumMod;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: (chromium as any).defaultViewport,
    executablePath:
      process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath(process.env.CHROMIUM_DOWNLOAD_URL)),
    headless: (chromium as any).headless,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '12mm', right: '12mm' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
