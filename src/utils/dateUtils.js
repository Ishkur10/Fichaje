/**
 * Formatea una fecha en formato legible
 * @param {string|Date} fecha - Fecha a formatear
 * @param {object} options - Opciones de formato 
 * @returns {string} Fecha formateada
 */
export const formatearFecha = (fecha, options = {}) => {
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  
  const defaultOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  try {
    return date.toLocaleDateString(undefined, defaultOptions);
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Fecha inválida';
  }
};

/**
 * Formatea una hora en formato legible
 * @param {string|Date} fecha - Fecha de la que extraer la hora
 * @param {object} options - Opciones de formato
 * @returns {string} Hora formateada
 */
export const formatearHora = (fecha, options = {}) => {
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  try {
    return date.toLocaleTimeString(undefined, defaultOptions);
  } catch (error) {
    console.error('Error al formatear hora:', error);
    return 'Hora inválida';
  }
};

/**
 * Calcula la diferencia en horas entre dos fechas
 * @param {string|Date} fechaInicio - Fecha de inicio
 * @param {string|Date} fechaFin - Fecha de fin
 * @returns {number} Diferencia en horas (con decimales)
 */
export const calcularHorasTrabajadas = (fechaInicio, fechaFin) => {
  const inicio = fechaInicio instanceof Date ? fechaInicio : new Date(fechaInicio);
  const fin = fechaFin instanceof Date ? fechaFin : new Date(fechaFin);
  
  // Comprobar que las fechas son válidas
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    return 0;
  }
  
  // Calcular diferencia en milisegundos y convertir a horas
  const diffMs = fin.getTime() - inicio.getTime();
  return diffMs / (1000 * 60 * 60);
};

/**
 * Obtiene el primer y último día del mes
 * @param {number} año - Año
 * @param {number} mes - Mes (1-12)
 * @returns {object} Objeto con primer y último día del mes
 */
export const obtenerRangoMes = (año, mes) => {
  const primerDia = new Date(año, mes - 1, 1);
  const ultimoDia = new Date(año, mes, 0);
  
  return {
    primerDia,
    ultimoDia
  };
};

/**
 * Agrupa fichajes por día
 * @param {Array} fichajes - Lista de fichajes
 * @returns {Object} Fichajes agrupados por día
 */
export const agruparFichajesPorDia = (fichajes) => {
  const fichajesPorDia = {};
  
  fichajes.forEach(fichaje => {
    const fecha = new Date(fichaje.fecha).toLocaleDateString();
    
    if (!fichajesPorDia[fecha]) {
      fichajesPorDia[fecha] = [];
    }
    
    fichajesPorDia[fecha].push(fichaje);
  });
  
  return fichajesPorDia;
};