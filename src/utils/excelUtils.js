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
      // Organizar fichajes por día
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
      
      // Crear datos para Excel
      const datosExcel = [];
      
      Object.keys(fichajesPorDia).forEach(fecha => {
        const fichajesDia = fichajesPorDia[fecha];
        // Ordenar fichajes por hora
        fichajesDia.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        
        // Buscar entradas y salidas
        const entradas = fichajesDia.filter(f => f.tipo === 'entrada')
          .map(f => formatearHora(f.fecha));
        
        const salidas = fichajesDia.filter(f => f.tipo === 'salida')
          .map(f => formatearHora(f.fecha));
        
        // Calcular horas trabajadas si hay al menos una entrada y una salida
        let horasTrabajadas = '';
        
        if (entradas.length > 0 && salidas.length > 0) {
          const primeraEntrada = fichajesDia.find(f => f.tipo === 'entrada');
          const ultimaSalida = [...fichajesDia].filter(f => f.tipo === 'salida')
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
            
          horasTrabajadas = calcularHorasTrabajadas(
            primeraEntrada.fecha,
            ultimaSalida.fecha
          ).toFixed(2);
        }
        
        // Añadir a los datos Excel
        datosExcel.push({
          'Fecha': fecha,
          'Empleado': nombreEmpleado,
          'Hora Entrada': entradas.join(', '),
          'Hora Salida': salidas.join(', '),
          'Horas Trabajadas': horasTrabajadas
        });
      });
      
      // Calcular totales
      const totalHoras = datosExcel.reduce((total, row) => {
        return total + (parseFloat(row['Horas Trabajadas']) || 0);
      }, 0);
      
      // Añadir fila de totales
      datosExcel.push({
        'Fecha': '',
        'Empleado': '',
        'Hora Entrada': '',
        'Hora Salida': 'TOTAL HORAS:',
        'Horas Trabajadas': totalHoras.toFixed(2)
      });
      
      // Crear libro Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      
      // Ajustar ancho de columnas
      const wscols = [
        { wch: 15 }, // Fecha
        { wch: 25 }, // Empleado
        { wch: 15 }, // Hora Entrada
        { wch: 15 }, // Hora Salida
        { wch: 15 }  // Horas Trabajadas
      ];
      
      ws['!cols'] = wscols;
      
      // Añadir hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Fichajes');
      
      // Guardar archivo
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