import * as XLSX from 'xlsx';
import { formatearFecha, formatearHora, calcularHorasTrabajadas } from './dateUtils';

/**
 * Genera un archivo Excel con los fichajes
 * @param {Array} fichajes - Lista de fichajes
 * @param {string} nombreArchivo - Nombre del archivo a generar
 * @param {string} nombreEmpleado - Nombre del empleado
 * @returns {Promise} Promesa que se resuelve cuando el archivo se ha generado
 */
export const generarExcel = (fichajes, nombreArchivo, nombreEmpleado) => {
  return new Promise((resolve, reject) => {
    try {
      // Organize check-ins and check-outs by date
      const fichajesPorDia = {};
      
      fichajes.forEach(fichaje => {
        const fecha = formatearFecha(fichaje.fecha, {
          weekday: undefined,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        if (!fichajesPorDia[fecha]) {
          fichajesPorDia[fecha] = [];
        }
        
        fichajesPorDia[fecha].push(fichaje);
      });
      
      // Create Excel data
      const datosExcel = [];
      let totalHorasGlobal = 0;
      let totalMinutosGlobal = 0;
      
      Object.keys(fichajesPorDia).forEach(fecha => {
        const fichajesDia = fichajesPorDia[fecha];
        // Sort check-ins and check-outs by time
        fichajesDia.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        
        // Find check-ins and check-outs
        const entradas = fichajesDia.filter(f => f.tipo === 'entrada')
          .map(f => formatearHora(f.fecha));
        
        const salidas = fichajesDia.filter(f => f.tipo === 'salida');
        const salidasHoras = salidas.map(f => formatearHora(f.fecha));
        
        // Calculate worked hours if there's at least one check-in and check-out
        let tiempoPausa = '';
        let tiempoEfectivo = '';
        
        if (entradas.length > 0 && salidas.length > 0) {
          // Find exit records with registered work time
          const salidasConTiempo = salidas.filter(s => s.tiempoTrabajado !== undefined && s.entradaId !== undefined);
          
          if (salidasConTiempo.length > 0) {
            // Use the recorded work time that already accounts for pauses
            let totalSegundos = 0;
            
            salidasConTiempo.forEach(salida => {
              totalSegundos += salida.tiempoTrabajado || 0;
            });
            
            // Convert to hours and minutes
            const horas = Math.floor(totalSegundos / 3600);
            const minutos = Math.floor((totalSegundos % 3600) / 60);
            
            tiempoEfectivo = `${horas}h ${minutos}m`;
            
            // Calculate and format pause time
            const primeraEntrada = fichajesDia.find(f => f.tipo === 'entrada');
            const ultimaSalida = salidas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
            
            const tiempoTotal = (new Date(ultimaSalida.fecha) - new Date(primeraEntrada.fecha)) / 1000;
            const tiempoPausado = tiempoTotal - totalSegundos;
            
            if (tiempoPausado > 0) {
              const horasPausa = Math.floor(tiempoPausado / 3600);
              const minutosPausa = Math.floor((tiempoPausado % 3600) / 60);
              tiempoPausa = `${horasPausa}h ${minutosPausa}m`;
            } else {
              tiempoPausa = "0h 0m";
            }
            
            // Add to global totals
            totalHorasGlobal += horas;
            totalMinutosGlobal += minutos;
          } else {
            // Fallback to raw time calculation if no recorded work time
            const primeraEntrada = fichajesDia.find(f => f.tipo === 'entrada');
            const ultimaSalida = salidas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
            
            const tiempoRaw = calcularHorasTrabajadas(primeraEntrada.fecha, ultimaSalida.fecha);
            const horas = Math.floor(tiempoRaw);
            const minutos = Math.round((tiempoRaw - horas) * 60);

            tiempoEfectivo = `${horas}h ${minutos}m`;
            tiempoPausa = "0h 0m"; // No pause info available
            
            // Add to global totals
            totalHorasGlobal += horas;
            totalMinutosGlobal += minutos;
          }
        }
        
        // Add to Excel data
        datosExcel.push({
          'Fecha': fecha,
          'Empleado': nombreEmpleado,
          'Hora Entrada': entradas.join(', '),
          'Hora Salida': salidasHoras.join(', '),
          'Tiempo Pausa': tiempoPausa,
          'Tiempo Efectivo': tiempoEfectivo
        });
      });
      
      // Normalize global minutes to hours
      if (totalMinutosGlobal >= 60) {
        const horasExtra = Math.floor(totalMinutosGlobal / 60);
        totalHorasGlobal += horasExtra;
        totalMinutosGlobal %= 60;
      }
      
      // Format total time properly
      const totalFormateado = `${totalHorasGlobal}h ${totalMinutosGlobal}m`;
      const totalDecimal = `${totalHorasGlobal}.${Math.floor((totalMinutosGlobal / 60) * 100)}`;
      
      // Add totals row
      datosExcel.push({
        'Fecha': '',
        'Empleado': '',
        'Hora Entrada': '',
        'Hora Salida': 'TOTAL:',
        'Tiempo Pausa': '',
        'Tiempo Efectivo': totalFormateado
      });
      
      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      
      // Adjust column widths
      const wscols = [
        { wch: 15 }, // Fecha
        { wch: 25 }, // Empleado
        { wch: 15 }, // Hora Entrada
        { wch: 15 }, // Hora Salida
        { wch: 15 }, // Tiempo Pausa 
        { wch: 15 } // Tiempo Efectivo
      ];
      
      ws['!cols'] = wscols;
      
      // Add sheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Fichajes');
      
      // Save file
      XLSX.writeFile(wb, nombreArchivo);
      resolve();
    } catch (error) {
      console.error('Error al generar Excel:', error);
      reject(error);
    }
  });
};

/**
 * Genera un informe Excel más completo con estadísticas
 * @param {Array} fichajes - Lista de fichajes
 * @param {string} nombreArchivo - Nombre del archivo a generar
 * @param {object} options - Opciones adicionales
 * @returns {Promise} Promesa que se resuelve cuando el archivo se ha generado
 */
export const generarInformeCompleto = (fichajes, nombreArchivo, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const { nombreEmpleado, periodo } = options;
      
      // Crear libro Excel
      const wb = XLSX.utils.book_new();
      
      // Hoja 1: Registro diario
      const datosRegistro = generarDatosRegistroDiario(fichajes, nombreEmpleado);
      const wsRegistro = XLSX.utils.json_to_sheet(datosRegistro);
      XLSX.utils.book_append_sheet(wb, wsRegistro, 'Registro Diario');
      
      // Hoja 2: Resumen
      const datosResumen = generarDatosResumen(fichajes, nombreEmpleado, periodo);
      const wsResumen = XLSX.utils.json_to_sheet(datosResumen);
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
      
      // Guardar archivo
      XLSX.writeFile(wb, nombreArchivo);
      resolve();
    } catch (error) {
      console.error('Error al generar informe completo:', error);
      reject(error);
    }
  });
};

// Función auxiliar para generar datos de registro diario
const generarDatosRegistroDiario = (fichajes, nombreEmpleado) => {
  // Implementación similar a generarExcel pero con formato más completo
  // ...
  
  // Simplificado para brevedad
  return [];
};

// Función auxiliar para generar datos de resumen
const generarDatosResumen = (fichajes, nombreEmpleado, periodo) => {
  // Implementación del resumen con totales por semana, mes, etc.
  // ...
  
  // Simplificado para brevedad
  return [];
};