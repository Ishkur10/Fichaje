import React, { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, ChevronDown, ChevronUp, BarChart } from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';
import { calcularEstadisticas } from '../../utils/estadisticasUtils';
import { formatearFecha } from '../../utils/dateUtils';

const ResumenHoras = () => {
  const { fichajes } = useFichaje();
  const [estadisticas, setEstadisticas] = useState(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('semanaActual');
  const [expandirSemanas, setExpandirSemanas] = useState(false);
  const [expandirDias, setExpandirDias] = useState(false);

  useEffect(() => {
    if (fichajes.length === 0) {
      setEstadisticas(null);
      return;
    }

    const hoy = new Date();
    let fechaInicio = new Date();
    let fechaFin = new Date();
    
    switch (periodoSeleccionado) {
      case 'semanaActual':
        fechaInicio.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1));
        fechaInicio.setHours(0, 0, 0, 0);

        fechaFin.setDate(fechaInicio.getDate() + 6);
        fechaFin.setHours(23, 59, 59, 999);
        break;
        
      case 'mesActual':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
        
      case 'todo':
        fechaInicio = null;
        fechaFin = null;
        break;
        
      default:
        break;
    }
    

    const stats = calcularEstadisticas(fichajes, fechaInicio, fechaFin);
    setEstadisticas(stats);
  }, [fichajes, periodoSeleccionado]);

  if (!estadisticas || estadisticas.diasTrabajados === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <BarChart className="h-5 w-5 mr-2" /> Resumen de Horas Trabajadas
        </h2>
        
        <div className="flex gap-2 mb-4">
          <PeriodoSelector 
            periodoSeleccionado={periodoSeleccionado} 
            setPeriodoSeleccionado={setPeriodoSeleccionado} 
          />
        </div>
        
        <div className="text-center py-8 text-gray-500">
          No hay datos de horas trabajadas para el periodo seleccionado
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <BarChart className="h-5 w-5 mr-2" /> Resumen de Horas Trabajadas
      </h2>
      
      <div className="flex gap-2 mb-6">
        <PeriodoSelector 
          periodoSeleccionado={periodoSeleccionado} 
          setPeriodoSeleccionado={setPeriodoSeleccionado} 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm text-blue-800 font-medium mb-1">Total Horas Trabajadas</h3>
          <p className="text-2xl font-bold text-blue-700">
            {estadisticas.totalHoras}h {estadisticas.totalMinutos}m
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm text-green-800 font-medium mb-1">Días Trabajados</h3>
          <p className="text-2xl font-bold text-green-700">
            {estadisticas.diasTrabajados} {estadisticas.diasTrabajados === 1 ? 'día' : 'días'}
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm text-purple-800 font-medium mb-1">Promedio Diario</h3>
          <p className="text-2xl font-bold text-purple-700">
            {estadisticas.horasPromedioDiario.toFixed(1)}h
          </p>
        </div>
      </div>
      

      <div className="mb-6">
        <div 
          className="flex items-center justify-between cursor-pointer bg-gray-50 p-3 rounded-lg mb-2"
          onClick={() => setExpandirSemanas(!expandirSemanas)}
        >
          <h3 className="text-md font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-2" /> Horas por Semana
          </h3>
          <button>
            {expandirSemanas ? 
              <ChevronUp className="h-5 w-5 text-gray-500" /> : 
              <ChevronDown className="h-5 w-5 text-gray-500" />
            }
          </button>
        </div>
        
        {expandirSemanas && (
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Semana
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Días Trabajados
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Horas Totales
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estadisticas.semanasArray.map((semana, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      Semana {semana.semana}, {semana.año}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {semana.dias} {semana.dias === 1 ? 'día' : 'días'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 font-medium">
                      {semana.horas}h {semana.minutos}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div>
        <div 
          className="flex items-center justify-between cursor-pointer bg-gray-50 p-3 rounded-lg mb-2"
          onClick={() => setExpandirDias(!expandirDias)}
        >
          <h3 className="text-md font-medium flex items-center">
            <Clock className="h-4 w-4 mr-2" /> Horas por Día
          </h3>
          <button>
            {expandirDias ? 
              <ChevronUp className="h-5 w-5 text-gray-500" /> : 
              <ChevronDown className="h-5 w-5 text-gray-500" />
            }
          </button>
        </div>
        
        {expandirDias && (
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Entrada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Salida
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Horas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estadisticas.porDia.map((dia, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {dia.fechaFormateada}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {dia.entrada}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {dia.salida}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 font-medium">
                      {dia.horas}h {dia.minutos}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


const PeriodoSelector = ({ periodoSeleccionado, setPeriodoSeleccionado }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setPeriodoSeleccionado('semanaActual')}
        className={`px-3 py-1 text-sm font-medium rounded-full ${
          periodoSeleccionado === 'semanaActual'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Semana Actual
      </button>
      
      <button
        onClick={() => setPeriodoSeleccionado('mesActual')}
        className={`px-3 py-1 text-sm font-medium rounded-full ${
          periodoSeleccionado === 'mesActual'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Mes Actual
      </button>
      
      <button
        onClick={() => setPeriodoSeleccionado('todo')}
        className={`px-3 py-1 text-sm font-medium rounded-full ${
          periodoSeleccionado === 'todo'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Todo
      </button>
    </div>
  );
};

export default ResumenHoras;