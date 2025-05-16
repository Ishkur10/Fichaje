import React, { useState } from 'react';
import { FilePlus2, FileDown } from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';
import { generarExcel } from '../../utils/excelUtils';
import Button from '../ui/Button';

const InformeExcel = () => {
  const { nombreEmpleado, getFichajesPorPeriodo } = useFichaje();
  
  const [año, setAño] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  
  // Generar lista de años para el selector
  const añoActual = new Date().getFullYear();
  const años = [añoActual - 1, añoActual, añoActual + 1];
  
  // Lista de meses para el selector
  const meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];
  
  const handleGenerarInforme = async () => {
    try {
      setLoading(true);
      
      // Definir el rango de fechas
      const fechaInicio = new Date(año, mes - 1, 1);
      const fechaFin = new Date(año, mes, 0); // Último día del mes
      
      // Obtener fichajes del período
      const fichajes = getFichajesPorPeriodo(fechaInicio, fechaFin);
      
      // Generar y descargar el archivo Excel
      const nombreArchivo = `Fichajes_${nombreEmpleado || 'Empleado'}_${año}_${mes}.xlsx`;
      await generarExcel(fichajes, nombreArchivo, nombreEmpleado);
      
      setLoading(false);
    } catch (error) {
      console.error('Error al generar informe:', error);
      setLoading(false);
      alert('Error al generar el informe. Inténtelo de nuevo.');
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <FilePlus2 className="h-5 w-5 mr-2" /> Generar Informe Mensual
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Año
          </label>
          <select
            value={año}
            onChange={(e) => setAño(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {años.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mes
          </label>
          <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {meses.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <Button
        onClick={handleGenerarInforme}
        variant="success"
        fullWidth
        icon={<FileDown className="h-5 w-5" />}
        disabled={loading}
      >
        {loading ? 'Generando...' : 'Descargar Informe Excel'}
      </Button>
    </div>
  );
};

export default InformeExcel;