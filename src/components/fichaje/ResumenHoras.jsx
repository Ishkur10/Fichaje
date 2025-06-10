import React, { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, ChevronDown, ChevronUp, BarChart, PlayCircle, Star, Gift } from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';

const ResumenHoras = () => {
  const { fichajes, sesionActiva, tiempoSesion, getEstadisticasExtendidas, verificarFestivo } = useFichaje();
  const [estadisticas, setEstadisticas] = useState(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('semanaActual');
  const [expandirSemanas, setExpandirSemanas] = useState(false);
  const [expandirDias, setExpandirDias] = useState(false);
  
  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    return { horas, minutos };
  };
  
  const calcularEstadisticas = () => {
    console.log("Calculating statistics with:", { 
      fichajes, 
      sesionActiva, 
      tiempoSesion 
    });
    if (fichajes.length === 0 && !sesionActiva) {
      console.log("No fichajes found and no active session");
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
    

    const fichajesFiltrados = fechaInicio && fechaFin 
      ? fichajes.filter(fichaje => {
          const fecha = new Date(fichaje.fecha);
          return fecha >= fechaInicio && fecha <= fechaFin;
        })
      : [...fichajes];
      
    const diasTrabajados = {};
    
    const salidasConTiempo = fichajesFiltrados.filter(f => 
      f.tipo === 'salida' && f.entradaId !== undefined
    );
    
    salidasConTiempo.forEach(salida => {
      const entrada = fichajesFiltrados.find(f => f.id === salida.entradaId);
      if (entrada) {
        const fecha = new Date(entrada.fecha).toLocaleDateString();
        
        if (!diasTrabajados[fecha]) {
          diasTrabajados[fecha] = {
            pares: [],
            tiempoTotal: 0,
            fecha: new Date(entrada.fecha)
          };
        }
        
        diasTrabajados[fecha].pares.push({
          entrada,
          salida,
          tiempoTrabajado: salida.tiempoTrabajado,
          tiempoFormateado: salida.tiempoFormateado
        });
        
        diasTrabajados[fecha].tiempoTotal += salida.tiempoTrabajado || 0;
      }
    });
    
    if (sesionActiva) {
      const entradaSesion = fichajesFiltrados.find(f => f.id === sesionActiva.id);
      
      if (entradaSesion) {
        const fecha = new Date(entradaSesion.fecha).toLocaleDateString();
        
        if (!diasTrabajados[fecha]) {
          diasTrabajados[fecha] = {
            pares: [],
            tiempoTotal: 0,
            fecha: new Date(entradaSesion.fecha)
          };
        }
        
        const tiempoSesionActual = tiempoSesion;
        
        const tiempo = formatearTiempo(tiempoSesionActual);
        const tiempoFormateado = `${tiempo.horas.toString().padStart(2, '0')}:${tiempo.minutos.toString().padStart(2, '0')}`;
        
        diasTrabajados[fecha].pares.push({
          entrada: entradaSesion,
          salida: {
            id: 'virtual',
            fecha: new Date().toISOString(),
            tipo: 'salida',
            virtual: true
          },
          tiempoTrabajado: tiempoSesionActual,
          tiempoFormateado,
          esActiva: true
        });
        
        diasTrabajados[fecha].tiempoTotal += tiempoSesionActual;
      }
    }
    
    let totalSegundos = 0;
    const porDia = [];
    const semanasMap = {};
    
    Object.keys(diasTrabajados).forEach(fecha => {
      const dia = diasTrabajados[fecha];
      const tiempoTotal = dia.tiempoTotal;
      totalSegundos += tiempoTotal;
      
      const tiempo = formatearTiempo(tiempoTotal);
      
      const fechaObj = dia.fecha;
      const numSemana = getNumeroSemana(fechaObj);
      const año = fechaObj.getFullYear();
      const claveSemana = `${año}-W${numSemana}`;
      
      // Verificar si es festivo
      const infoFestivo = verificarFestivo(fechaObj);
      
      porDia.push({
        fecha,
        fechaFormateada: fechaObj.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }),
        entrada: dia.pares[0]?.entrada.fecha,
        salida: dia.pares[dia.pares.length - 1]?.salida.fecha,
        horas: tiempo.horas,
        minutos: tiempo.minutos,
        segundos: tiempoTotal,
        incluyeSesionActiva: dia.pares.some(p => p.esActiva),
        esFestivo: infoFestivo.esFestivo,
        tipoFestivo: infoFestivo.tipo,
        nombreFestivo: infoFestivo.nombre
      });
      
      if (!semanasMap[claveSemana]) {
        semanasMap[claveSemana] = {
          semana: numSemana,
          año,
          tiempoTotal: 0,
          dias: 0,
          incluyeSesionActiva: false
        };
      }
      
      semanasMap[claveSemana].tiempoTotal += tiempoTotal;
      semanasMap[claveSemana].dias += 1;
      
      if (dia.pares.some(p => p.esActiva)) {
        semanasMap[claveSemana].incluyeSesionActiva = true;
      }
    });
    
    porDia.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    const semanasArray = Object.values(semanasMap).map(semana => {
      const tiempo = formatearTiempo(semana.tiempoTotal);
      return {
        ...semana,
        horas: tiempo.horas,
        minutos: tiempo.minutos
      };
    }).sort((a, b) => {
      if (a.año !== b.año) return b.año - a.año;
      return b.semana - a.semana;
    });
    
    const tiempoTotalFormateado = formatearTiempo(totalSegundos);
    
    // Contar días festivos trabajados
    const diasFestivosTrabajados = porDia.filter(dia => dia.esFestivo).length;
    
    setEstadisticas({
      totalHoras: tiempoTotalFormateado.horas,
      totalMinutos: tiempoTotalFormateado.minutos,
      totalSegundos,
      diasTrabajados: Object.keys(diasTrabajados).length,
      diasFestivosTrabajados,
      horasPromedioDiario: Object.keys(diasTrabajados).length > 0 
        ? totalSegundos / (3600 * Object.keys(diasTrabajados).length) 
        : 0,
      porDia,
      semanasArray
    });
  };
  
  const getNumeroSemana = (fecha) => {
    const primerDia = new Date(fecha.getFullYear(), 0, 1);
    const diasPasados = Math.floor((fecha - primerDia) / (24 * 60 * 60 * 1000));
    return Math.ceil((diasPasados + primerDia.getDay() + 1) / 7);
  };
  
  useEffect(() => {
    calcularEstadisticas();
  }, [fichajes, periodoSeleccionado, sesionActiva, tiempoSesion]);
  
  if (!estadisticas || (estadisticas.diasTrabajados === 0 && !sesionActiva)) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
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
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <BarChart className="h-5 w-5 mr-2" /> Resumen de Horas Trabajadas
      </h2>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <PeriodoSelector 
          periodoSeleccionado={periodoSeleccionado} 
          setPeriodoSeleccionado={setPeriodoSeleccionado} 
        />
      </div>
      
      {/* Sesión activa indicador */}
      {sesionActiva && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
          <PlayCircle className="h-5 w-5 text-blue-500 mr-2" />
          <div className="text-blue-800 text-sm">
            <span className="font-medium">Sesión activa</span> - Las estadísticas incluyen el tiempo de la sesión actual
          </div>
        </div>
      )}
      
      {/* Resumen General */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm text-yellow-800 font-medium mb-1 flex items-center">
            <Gift className="h-4 w-4 mr-1" />
            Días Festivos
          </h3>
          <p className="text-2xl font-bold text-yellow-700">
            {estadisticas.diasFestivosTrabajados}
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            trabajados
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm text-purple-800 font-medium mb-1">Promedio Diario</h3>
          <p className="text-2xl font-bold text-purple-700">
            {estadisticas.horasPromedioDiario.toFixed(1)}h
          </p>
        </div>
      </div>
      
      {/* Resumen por Semana */}
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
            {/* Versión de escritorio */}
            <div className="hidden sm:block">
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
                        {semana.incluyeSesionActiva && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <PlayCircle className="h-3 w-3 mr-1" /> Activa
                          </span>
                        )}
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
            
            {/* Versión móvil - tarjetas */}
            <div className="sm:hidden space-y-3 p-3">
              {estadisticas.semanasArray.map((semana, index) => (
                <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <div className="font-medium text-gray-800 mb-1 flex items-center">
                    Semana {semana.semana}, {semana.año}
                    {semana.incluyeSesionActiva && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        <PlayCircle className="h-3 w-3 mr-1" /> Activa
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Días: </span>
                      <span className="font-medium">{semana.dias}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500">Horas: </span>
                      <span className="font-medium">{semana.horas}h {semana.minutos}m</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Resumen por Día */}
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
            {/* Versión de escritorio */}
            <div className="hidden sm:block">
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
                      Horas Efectivas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estadisticas.porDia.map((dia, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                        <div className="flex items-center">
                          {dia.esFestivo && (
                            <Gift className="h-4 w-4 mr-2 text-yellow-500" title={dia.nombreFestivo} />
                          )}
                          {dia.fechaFormateada}
                        </div>
                        <div className="flex items-center mt-1">
                          {dia.incluyeSesionActiva && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                              <PlayCircle className="h-3 w-3 mr-1" /> Activa
                            </span>
                          )}
                          {dia.esFestivo && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" /> {dia.nombreFestivo}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(dia.entrada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(dia.salida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {dia.incluyeSesionActiva && <span className="text-blue-600 italic"> (actual)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 font-medium">
                        {dia.horas}h {dia.minutos}m
                        {dia.esFestivo && <span className="text-yellow-600 text-xs block">+festivo</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Versión móvil - tarjetas */}
            <div className="sm:hidden space-y-3 p-3">
              {estadisticas.porDia.map((dia, index) => (
                <div key={index} className={`bg-white p-3 rounded-lg shadow-sm border-2 transition-all ${
                  dia.esFestivo ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100'
                }`}>
                  <div className="font-medium text-gray-800 mb-2">
                    <div className="flex items-center">
                      {dia.esFestivo && (
                        <Gift className="h-4 w-4 mr-2 text-yellow-500" />
                      )}
                      {dia.fechaFormateada}
                    </div>
                    <div className="flex items-center mt-1 space-x-1">
                      {dia.incluyeSesionActiva && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          <PlayCircle className="h-3 w-3 mr-1" /> Activa
                        </span>
                      )}
                      {dia.esFestivo && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" /> {dia.nombreFestivo}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Entrada:</p>
                      <p className="font-medium">{new Date(dia.entrada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Salida:</p>
                      <p className="font-medium">
                        {new Date(dia.salida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {dia.incluyeSesionActiva && <span className="text-blue-600 italic"> (actual)</span>}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 text-right">
                    <span className="text-gray-500 text-xs">Tiempo efectivo:</span>
                    <span className="ml-1 font-medium">{dia.horas}h {dia.minutos}m</span>
                    {dia.esFestivo && (
                      <span className="block text-yellow-600 text-xs font-medium mt-1">
                        ✨ Trabajado en festivo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
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