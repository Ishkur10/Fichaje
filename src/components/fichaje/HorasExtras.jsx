import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  TrendingUp, 
  Calendar, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  CheckCircle,
  Star,
  PlayCircle
} from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';
import { 
  calcularResumenHorasExtras, 
  formatearTiempoExtras, 
  obtenerTipoDia,
  CONFIG_HORAS_EXTRAS 
} from '../../utils/horasExtrasUtils';

const HorasExtras = () => {
  const { fichajes, sesionActiva, tiempoSesion } = useFichaje();
  const [resumenExtras, setResumenExtras] = useState(null);
  const [expandirSemanas, setExpandirSemanas] = useState(false);
  const [expandirMeses, setExpandirMeses] = useState(false);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('todo');

  const calcularHorasExtras = () => {
    if (fichajes.length === 0 && !sesionActiva) {
      setResumenExtras(null);
      return;
    }

    const hoy = new Date();
    let fechaInicio = null;
    let fechaFin = null;

    switch (periodoSeleccionado) {
      case 'mesActual':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'año':
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        fechaFin = new Date(hoy.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'todo':
      default:
        // Se calculará automáticamente en la función
        break;
    }

    const resumen = calcularResumenHorasExtras(fichajes, sesionActiva, fechaInicio, fechaFin);
    setResumenExtras(resumen);
  };

  useEffect(() => {
    calcularHorasExtras();
  }, [fichajes, sesionActiva, tiempoSesion, periodoSeleccionado]);

  if (!resumenExtras || resumenExtras.horasExtrasTotal === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Award className="h-5 w-5 mr-2 text-yellow-600" /> 
          Horas Extras Acumuladas
        </h2>
        
        <div className="flex gap-2 mb-4">
          <PeriodoSelector 
            periodoSeleccionado={periodoSeleccionado} 
            setPeriodoSeleccionado={setPeriodoSeleccionado} 
          />
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">No hay horas extras registradas</p>
          <p className="text-sm">Las horas extras se acumulan cuando trabajas más de {CONFIG_HORAS_EXTRAS.HORAS_SEMANALES_STANDARD} horas por semana</p>
        </div>
      </div>
    );
  }

  const tiempoFormateado = formatearTiempoExtras(resumenExtras.totalSegundosExtras);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Award className="h-5 w-5 mr-2 text-yellow-600" /> 
        Horas Extras Acumuladas
      </h2>

      <div className="flex flex-wrap gap-2 mb-6">
        <PeriodoSelector 
          periodoSeleccionado={periodoSeleccionado} 
          setPeriodoSeleccionado={setPeriodoSeleccionado} 
        />
      </div>

      {/* Indicador de sesión activa */}
      {sesionActiva && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
          <PlayCircle className="h-5 w-5 text-blue-500 mr-2" />
          <div className="text-blue-800 text-sm">
            <span className="font-medium">Sesión activa</span> - Las horas extras incluyen el tiempo de la sesión actual
          </div>
        </div>
      )}

      {/* Resumen principal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
          <h3 className="text-sm text-yellow-800 font-medium mb-1 flex items-center">
            <Star className="h-4 w-4 mr-1" />
            Total Horas Extras
          </h3>
          <p className="text-2xl font-bold text-yellow-700">
            {tiempoFormateado.texto}
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Equivalente a {(resumenExtras.horasExtrasTotal / 8).toFixed(1)} días laborables
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm text-green-800 font-medium mb-1 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Semanas con Extras
          </h3>
          <p className="text-2xl font-bold text-green-700">
            {resumenExtras.semanas.filter(s => s.horasExtras > 0).length}
          </p>
          <p className="text-xs text-green-600 mt-1">
            de {resumenExtras.semanas.length} semanas totales
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 sm:col-span-2 lg:col-span-1">
          <h3 className="text-sm text-purple-800 font-medium mb-1 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            Promedio Semanal
          </h3>
          <p className="text-2xl font-bold text-purple-700">
            {(resumenExtras.horasExtrasTotal / Math.max(1, resumenExtras.semanas.length)).toFixed(1)}h
          </p>
          <p className="text-xs text-purple-600 mt-1">
            extras por semana
          </p>
        </div>
      </div>

      {/* Resumen por mes */}
      {resumenExtras.resumenPorMes.length > 0 && (
        <div className="mb-6">
          <div 
            className="flex items-center justify-between cursor-pointer bg-gray-50 p-3 rounded-lg mb-2"
            onClick={() => setExpandirMeses(!expandirMeses)}
          >
            <h3 className="text-md font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2" /> 
              Horas Extras por Mes
            </h3>
            <button>
              {expandirMeses ? 
                <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                <ChevronDown className="h-5 w-5 text-gray-500" />
              }
            </button>
          </div>

          {expandirMeses && (
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
                {resumenExtras.resumenPorMes.map((mes, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <div className="font-medium text-gray-800 mb-1">{mes.mes}</div>
                    <div className="text-lg font-bold text-yellow-600">
                      {formatearTiempoExtras(mes.horasExtras * 3600).texto}
                    </div>
                    <div className="text-xs text-gray-500">
                      {mes.semanas} semana{mes.semanas !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detalle por semanas */}
      <div>
        <div 
          className="flex items-center justify-between cursor-pointer bg-gray-50 p-3 rounded-lg mb-2"
          onClick={() => setExpandirSemanas(!expandirSemanas)}
        >
          <h3 className="text-md font-medium flex items-center">
            <Clock className="h-4 w-4 mr-2" /> 
            Detalle por Semanas
          </h3>
          <button>
            {expandirSemanas ? 
              <ChevronUp className="h-5 w-5 text-gray-500" /> : 
              <ChevronDown className="h-5 w-5 text-gray-500" />
            }
          </button>
        </div>

        {expandirSemanas && (
          <div className="bg-gray-50 rounded-lg">
            <div className="space-y-3 p-3">
              {resumenExtras.semanas.map((semana, index) => (
                <SemanaCard 
                  key={`${semana.año}-${semana.semanaISO}`} 
                  semana={semana} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SemanaCard = ({ semana }) => {
  const [expandirDias, setExpandirDias] = useState(false);
  const tiempoExtras = formatearTiempoExtras(semana.horasExtras * 3600);
  
  const fechaInicio = semana.inicioSemana.toLocaleDateString('es', { 
    day: 'numeric', 
    month: 'short' 
  });
  const fechaFin = semana.finSemana.toLocaleDateString('es', { 
    day: 'numeric', 
    month: 'short' 
  });

  const tieneExtras = semana.horasExtras > 0;
  const tieneSesionActiva = semana.detallesPorDia.some(d => d.incluyeSesionActiva);

  return (
    <div className={`bg-white rounded-lg border-2 transition-all ${
      tieneExtras ? 'border-yellow-200' : 'border-gray-200'
    }`}>
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpandirDias(!expandirDias)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3">
              {tieneExtras ? (
                <Star className="h-5 w-5 text-yellow-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-800 flex items-center">
                Semana {semana.semanaISO}, {semana.año}
                {tieneSesionActiva && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    <PlayCircle className="h-3 w-3 mr-1" /> Activa
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {fechaInicio} - {fechaFin}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-gray-800">
              {semana.horasSemanales.toFixed(1)}h
            </div>
            {tieneExtras && (
              <div className="text-sm font-medium text-yellow-600">
                +{tiempoExtras.texto} extras
              </div>
            )}
            <div className="text-xs text-gray-500">
              {semana.diasTrabajados} día{semana.diasTrabajados !== 1 ? 's' : ''}
            </div>
          </div>

          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ml-2 ${
            expandirDias ? 'rotate-180' : ''
          }`} />
        </div>

        {/* Barra de progreso */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">Progreso semanal</span>
            <span className="text-xs text-gray-600">
              {((semana.horasSemanales / CONFIG_HORAS_EXTRAS.HORAS_SEMANALES_STANDARD) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                tieneExtras ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ 
                width: `${Math.min(100, (semana.horasSemanales / CONFIG_HORAS_EXTRAS.HORAS_SEMANALES_STANDARD) * 100)}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      {expandirDias && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="font-medium text-gray-800 mb-3">Detalle por días</h4>
          <div className="space-y-2">
            {semana.detallesPorDia.map((dia, index) => {
              const tipoDia = obtenerTipoDia(dia);
              const horas = Math.floor(dia.horasTrabajadas);
              const minutos = Math.floor((dia.horasTrabajadas % 1) * 60);
              
              return (
                <div key={index} className={`p-3 rounded-lg border ${tipoDia.bgColor} border-opacity-50`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-800">
                        {dia.fechaObj.toLocaleDateString('es', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                        {dia.incluyeSesionActiva && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            Activa
                          </span>
                        )}
                      </div>
                      <div className={`text-xs ${tipoDia.color} font-medium`}>
                        {tipoDia.etiqueta}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-800">
                        {horas}h {minutos}m
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(dia.entrada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                        {new Date(dia.salida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen de la semana */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Días laborables trabajados:</span>
                <span className="ml-1 font-medium">
                  {semana.detallesPorDia.filter(d => d.esLaborable).length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Días festivos trabajados:</span>
                <span className="ml-1 font-medium">
                  {semana.diasFestivos}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Horas teóricas:</span>
                <span className="ml-1 font-medium">
                  {semana.horasTeoricas}h
                </span>
              </div>
              <div>
                <span className="text-gray-600">Diferencia:</span>
                <span className={`ml-1 font-medium ${
                  semana.diferenciaHorasTeoricas >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {semana.diferenciaHorasTeoricas >= 0 ? '+' : ''}{semana.diferenciaHorasTeoricas.toFixed(1)}h
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PeriodoSelector = ({ periodoSeleccionado, setPeriodoSeleccionado }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setPeriodoSeleccionado('mesActual')}
        className={`px-3 py-1 text-sm font-medium rounded-full ${
          periodoSeleccionado === 'mesActual'
            ? 'bg-yellow-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Mes Actual
      </button>
      
      <button
        onClick={() => setPeriodoSeleccionado('año')}
        className={`px-3 py-1 text-sm font-medium rounded-full ${
          periodoSeleccionado === 'año'
            ? 'bg-yellow-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Este Año
      </button>
      
      <button
        onClick={() => setPeriodoSeleccionado('todo')}
        className={`px-3 py-1 text-sm font-medium rounded-full ${
          periodoSeleccionado === 'todo'
            ? 'bg-yellow-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Todo
      </button>
    </div>
  );
};

export default HorasExtras;
