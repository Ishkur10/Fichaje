import * as XLSX from 'xlsx';
import { formatearFecha, formatearHora, calcularHorasTrabajadas, agruparFichajesPorDia } from './dateUtils';

/**
 * Calcula estadísticas de horas trabajadas por día, semana y mes
 * @param {Array} fichajes - Lista de fichajes
 * @param {Date} fechaInicio - Fecha de inicio para el cálculo (opcional)
 * @param {Date} fechaFin - Fecha de fin para el cálculo (opcional)
 * @returns {Object} Objeto con estadísticas de tiempo trabajado
 */
export const calcularEstadisticas = (fichajes, fechaInicio = null, fechaFin = null) => {
  let fichajesFiltrados = [...fichajes];
  
  if (fechaInicio && fechaFin) {
    fichajesFiltrados = fichajes.filter(fichaje => {
      const fecha = new Date(fichaje.fecha);
      return fecha >= fechaInicio && fecha <= fechaFin;
    });
  }
  

  const fichajesPorDia = agruparFichajesPorDia(fichajesFiltrados);
  
  const estadisticas = {
    porDia: [],
    porSemana: {},
    totalHoras: 0,
    totalMinutos: 0,
    diasTrabajados: 0,
    horasPromedioDiario: 0
  };

  Object.keys(fichajesPorDia).forEach(fecha => {
    const fichajes = fichajesPorDia[fecha];
    
    fichajes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    const entradas = fichajes.filter(f => f.tipo === 'entrada');
    const salidas = fichajes.filter(f => f.tipo === 'salida');
    
    if (entradas.length > 0 && salidas.length > 0) {

      const primeraEntrada = entradas.reduce((min, entry) => 
        new Date(entry.fecha) < new Date(min.fecha) ? entry : min, entradas[0]);
      
      const ultimaSalida = salidas.reduce((max, entry) => 
        new Date(entry.fecha) > new Date(max.fecha) ? entry : max, salidas[0]);

      if (new Date(ultimaSalida.fecha) > new Date(primeraEntrada.fecha)) {

        const tiempoTrabajado = calcularHorasTrabajadas(primeraEntrada.fecha, ultimaSalida.fecha);
        

        const horas = Math.floor(tiempoTrabajado);
        const minutos = Math.round((tiempoTrabajado - horas) * 60);
        

        const fechaObj = new Date(primeraEntrada.fecha);
        const numSemana = getWeekNumber(fechaObj);
        const claveSemana = `${fechaObj.getFullYear()}-W${numSemana}`;
        
        estadisticas.porDia.push({
          fecha: fechaObj,
          fechaFormateada: formatearFecha(fechaObj, { weekday: 'long' }),
          entrada: formatearHora(primeraEntrada.fecha),
          salida: formatearHora(ultimaSalida.fecha),
          horas,
          minutos,
          tiempoTotal: tiempoTrabajado
        });
        

        if (!estadisticas.porSemana[claveSemana]) {
          estadisticas.porSemana[claveSemana] = {
            semana: numSemana,
            año: fechaObj.getFullYear(),
            tiempoTotal: 0,
            horas: 0,
            minutos: 0,
            dias: 0
          };
        }
        
        estadisticas.porSemana[claveSemana].tiempoTotal += tiempoTrabajado;
        estadisticas.porSemana[claveSemana].dias += 1;
        
        estadisticas.totalHoras += horas;
        estadisticas.totalMinutos += minutos;
        estadisticas.diasTrabajados += 1;
      }
    }
  });
  

  if (estadisticas.totalMinutos >= 60) {
    const horasExtra = Math.floor(estadisticas.totalMinutos / 60);
    estadisticas.totalHoras += horasExtra;
    estadisticas.totalMinutos %= 60;
  }
  

  if (estadisticas.diasTrabajados > 0) {
    const totalHorasDecimal = estadisticas.totalHoras + (estadisticas.totalMinutos / 60);
    estadisticas.horasPromedioDiario = totalHorasDecimal / estadisticas.diasTrabajados;
  }
  

  Object.keys(estadisticas.porSemana).forEach(claveSemana => {
    const semana = estadisticas.porSemana[claveSemana];
    semana.horas = Math.floor(semana.tiempoTotal);
    semana.minutos = Math.round((semana.tiempoTotal - semana.horas) * 60);
    

    if (semana.minutos >= 60) {
      const horasExtra = Math.floor(semana.minutos / 60);
      semana.horas += horasExtra;
      semana.minutos %= 60;
    }
  });
  
  estadisticas.semanasArray = Object.values(estadisticas.porSemana).sort((a, b) => {
    if (a.año !== b.año) return a.año - b.año;
    return a.semana - b.semana;
  });
  
  return estadisticas;
};

/**
 * Obtiene el número de semana de una fecha
 * @param {Date} fecha - Fecha para obtener el número de semana
 * @returns {number} Número de semana (1-53)
 */
function getWeekNumber(fecha) {
  const date = new Date(fecha);
  
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() + 3 - (firstThursday.getDay() + 6) % 7);
  
  const weekNumber = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + (firstThursday.getDay() + 6) % 7) / 7);
  
  return weekNumber;
}