import React, { useState } from 'react';
import { X, UploadCloud, Download, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchApi } from '../../utils/api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const TEMPLATE_HEADERS = [
  'Codigo Producto',
  'Codigo Actividad',
  'Nombre',
  'Descripcion',
  'Fecha Inicio',
  'Fecha Limite',
  'Meta',
  'Unidad',
  'Prioridad'
];

export default function ModalImportarRutas({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [eliminarActuales, setEliminarActuales] = useState(false);
  const [actividades, setActividades] = useState<any[]>([]);

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, 'plantilla_importacion_rutas.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrors([]);
    setActividades([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

        if (data.length < 2) {
          setErrors(["El archivo está vacío o no tiene datos."]);
          return;
        }

        const headers = data[0] as string[];
        const parsedActs: any[] = [];
        const newErrors: string[] = [];

        for (let i = 1; i < data.length; i++) {
          const row = data[i] as any[];
          if (!row || row.length === 0 || row.every(c => !c)) continue; // skip empty rows

          const act: any = {};
          let rowError = false;

          TEMPLATE_HEADERS.forEach((header, index) => {
            const val = row[index];
            if (val === undefined || val === null || val === '') {
              newErrors.push(`Fila ${i + 1}: Falta valor en la columna "${header}".`);
              rowError = true;
            }
          });

          if (!rowError) {
            // Mapping to expected API fields
            act.codigoProducto = String(row[0]);
            act.codigoActividad = String(row[1]);
            act.nombre = String(row[2]);
            act.descripcion = String(row[3]);
            act.fechaInicio = String(row[4]); // should validate date format
            act.fechaLimite = String(row[5]);
            act.indicadorMeta = Number(row[6]);
            act.indicadorUnidad = String(row[7]);
            act.prioridad = String(row[8]).toUpperCase();

            if (isNaN(act.indicadorMeta)) {
               newErrors.push(`Fila ${i + 1}: Meta no es un número válido.`);
            }
            parsedActs.push(act);
          }
        }

        if (newErrors.length > 0) {
          setErrors(newErrors);
        } else {
          setActividades(parsedActs);
        }
      } catch (err) {
        setErrors(["Error al leer el archivo Excel. Asegúrese de usar la plantilla."]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (actividades.length === 0) return;
    setLoading(true);

    try {
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades/importar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eliminarActuales, actividades })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error en la importación');
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      setErrors([e.message || "Error conectando con el servidor"]);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
             <UploadCloud className="w-6 h-6 text-bogota-primary" />
             Importar Rutas (Excel)
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-4 rounded-xl">
             <div className="text-sm text-blue-800">
               <p className="font-bold">1. Descarga la plantilla</p>
               <p>Llena los datos sin alterar el orden de las columnas.</p>
             </div>
             <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold text-sm">
                <Download className="w-4 h-4"/> Descargar
             </button>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-sm text-gray-800">2. Cargar archivo diligenciado (.xlsx)</p>
            <input type="file" accept=".xlsx" onChange={handleFileUpload} className="w-full border rounded p-2 text-sm" />
          </div>

          {errors.length > 0 && (
             <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-800 max-h-40 overflow-y-auto">
               <p className="font-bold mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Errores encontrados:</p>
               <ul className="list-disc pl-5 space-y-1">
                 {errors.map((e, idx) => <li key={idx}>{e}</li>)}
               </ul>
             </div>
          )}

          {actividades.length > 0 && errors.length === 0 && (
             <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-green-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm flex items-center gap-2"><FileSpreadsheet className="w-4 h-4"/> Archivo Válido</p>
                  <p className="text-xs mt-1">Se detectaron {actividades.length} actividades listas para importar.</p>
                </div>
             </div>
          )}

          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3">
             <input type="checkbox" id="eliminar" checked={eliminarActuales} onChange={e => setEliminarActuales(e.target.checked)} className="mt-1" />
             <div>
               <label htmlFor="eliminar" className="font-bold text-sm text-orange-900 cursor-pointer">Eliminar todas las actividades actuales antes de importar</label>
               <p className="text-xs text-orange-800 mt-1">¡Advertencia! Esto borrará permanentemente todo el registro de actividades, reportes locales y alertas asociadas.</p>
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-bold text-sm transition-colors">Cancelar</button>
          <button 
            onClick={handleImport} 
            disabled={loading || actividades.length === 0 || errors.length > 0} 
            className="bg-bogota-primary text-white px-6 py-2 rounded-lg hover:bg-red-700 font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Importando...' : 'Confirmar e Importar'}
          </button>
        </div>
      </div>
    </div>
  );
}
