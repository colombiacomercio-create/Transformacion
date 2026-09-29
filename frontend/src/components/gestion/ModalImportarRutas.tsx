import React, { useState } from 'react';
import { X, FileSpreadsheet, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchApi } from '../../utils/api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const TEMPLATE_HEADERS = [
  'Codigo Actividad',
  'Aspiracion',
  'Producto',
  'Actividad',
  'Descripcion',
  'Fecha inicio',
  'Fecha final',
  'Valor actividad (%)'
];

export default function ModalImportarRutas({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Rutas");
    XLSX.writeFile(wb, "plantilla_importacion_rutas.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length < 2) {
          setErrors(["El archivo esta vacio o no tiene datos."]);
          return;
        }

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
            act.codigoActividad = String(row[0]);
            act.aspiracion = String(row[1]);
            act.producto = String(row[2]);
            act.nombre = String(row[3]);
            act.descripcion = String(row[4]);
            act.fechaInicio = String(row[5]);
            act.fechaLimite = String(row[6]);
            act.valorActividad = String(row[7]);
            parsedActs.push(act);
          }
        }

        if (newErrors.length > 0) {
          setErrors(newErrors);
        } else {
          setActividades(parsedActs);
          setErrors([]);
        }
      } catch (err) {
        setErrors(["Error al procesar el archivo Excel. Asegurate de usar la plantilla."]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (actividades.length === 0) return;
    setLoading(true);
    setErrors([]);
    try {
      const res = await fetchApi(`${import.meta.env.VITE_API_URL || 'https://transformacion-backend.vercel.app'}/api/actividades/importar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eliminarActuales: false, actividades })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error en la importacion');
      }

      onSuccess();
    } catch (e: any) {
      setErrors([e.message]);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg text-green-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Importar Rutas de Transformacion</h2>
              <p className="text-xs text-gray-500 mt-1">Sube multiples actividades a la vez usando un archivo Excel.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
              <div className="mt-0.5"><CheckCircle2 className="w-5 h-5 text-blue-600" /></div>
              <div>
                <h4 className="font-bold text-sm text-blue-900">Paso 1: Descargar Plantilla</h4>
                <p className="text-xs text-blue-800 mt-1 mb-2">Usa nuestra plantilla oficial para evitar errores de formato.</p>
                <button onClick={handleDownloadTemplate} className="text-xs bg-white border border-blue-200 text-blue-700 font-bold px-3 py-1.5 rounded hover:bg-blue-100 transition-colors">
                  Descargar Plantilla.xlsx
                </button>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex flex-col gap-3">
               <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                 Paso 2: Subir Archivo <Upload className="w-4 h-4 text-gray-500" />
               </h4>
               <input 
                 type="file" 
                 accept=".xlsx, .xls" 
                 onChange={handleFileUpload}
                 className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-bogota-primary/10 file:text-bogota-primary hover:file:bg-bogota-primary/20 cursor-pointer"
               />
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-bold text-sm text-red-800">Errores encontrados:</h4>
              </div>
              <ul className="list-disc pl-5 text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                {errors.map((e, idx) => <li key={idx}>{e}</li>)}
              </ul>
            </div>
          )}

          {actividades.length > 0 && errors.length === 0 && (
             <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-green-900">Archivo valido</h4>
                  <p className="text-xs text-green-800 mt-1">Se detectaron <b>{actividades.length}</b> actividades listas para importar.</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
             </div>
          )}
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
