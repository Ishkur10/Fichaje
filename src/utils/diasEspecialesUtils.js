/**
 * Utilidades para gestión de días especiales (festivos manuales, bajas laborales, etc.)
 */

import storageService from '../services/storageService';

const DIAS_ESPECIALES_KEY = 'diasEspeciales';

// Tipos de días especiales
export const TIPOS_DIA_ESPECIAL = {
  FESTIVO_MANUAL: 'festivo_manual',
  FIESTA_PERSONAL: 'fiesta_personal', 
  BAJA_LABORAL: 'baja_laboral',
  VACACIONES: 'vacaciones',
  PERMISO: 'permiso'
};

// Configuración de horas por tipo de día especial
export const HORAS_DIA_ESPECIAL = {
  [TIPOS_DIA_ESPECIAL.FESTIVO_MANUAL]: (fecha) => getHorasLaborablesPorDia(fecha),
  [TIPOS_DIA_ESPECIAL.FIESTA_PERSONAL]: (fecha) => getHorasLaborablesPorDia(fecha),
  [TIPOS_DIA_ESPECIAL.BAJA_LABORAL]: (fecha) => getHorasLaborablesPorDia(fecha),
  [TIPOS_DIA_ESPECIAL.VACACIONES]: (fecha) => getHorasLaborablesPorDia(fecha),
  [TIPOS_DIA_ESPECIAL.PERMISO]: (fecha) => getHorasLaborablesPorDia(fecha)
};

/**
 * Obtiene las horas laborables según el día de la semana
 * @param {Date} fecha - Fecha del día
 * @returns {number} Horas que corresponden a ese día
 */
export const getHorasLaborablesPorDia = (fecha) => {
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
  const diaSemana = fechaObj.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
  
  // Lunes a Jueves: 9 horas
  if (diaSemana >= 1 && diaSemana <= 4) {
    return 9;
  }
  
  // Viernes: 4 horas
  if (diaSemana === 5) {
    return 4;
  }
  
  // Fin de semana: 0 horas (aunque se puede trabajar)
  return 0;
};

/**
 * Registra un día especial
 * @param {Date} fecha - Fecha del día especial
 * @param {string} tipo - Tipo de día especial
 * @param {string} motivo - Motivo o descripción
 * @param {string} empleado - Nombre del empleado
 * @param {number} horasCustom - Horas personalizadas (opcional)
 * @returns {object} Resultado de la operación
 */
export const registrarDiaEspecial = (fecha, tipo, motivo, empleado, horasCustom = null) => {
  try {
    const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
    const fechaISO = fechaObj.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const diasEspeciales = getDiasEspeciales();
    
    // Verificar si ya existe un registro para este día
    const registroExistente = diasEspeciales.find(d => 
      d.fecha === fechaISO && d.empleado === empleado
    );
    
    if (registroExistente) {
      return {
        success: false,
        message: 'Ya existe un registro especial para este día',
        registroExistente
      };
    }
    
    // Calcular horas según el tipo
    const horasCalculadas = horasCustom !== null ? horasCustom : HORAS_DIA_ESPECIAL[tipo](fechaObj);
    
    const nuevoDiaEspecial = {
      id: `especial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fecha: fechaISO,
      fechaCompleta: fechaObj.toISOString(),
      tipo,
      motivo,
      empleado,
      horas: horasCalculadas,
      fechaRegistro: new Date().toISOString(),
      diaSemana: fechaObj.toLocaleDateString('es', { weekday: 'long' }),
      activo: true
    };
    
    diasEspeciales.push(nuevoDiaEspecial);
    setDiasEspeciales(diasEspeciales);
    
    console.log('Día especial registrado:', nuevoDiaEspecial);
    
    return {
      success: true,
      diaEspecial: nuevoDiaEspecial,
      message: `Día especial registrado correctamente: ${getTipoDisplayName(tipo)}`
    };
    
  } catch (error) {
    console.error('Error al registrar día especial:', error);
    return {
      success: false,
      error: error.message,
      message: 'Error al registrar el día especial'
    };
  }
};

/**
 * Obtiene todos los días especiales registrados
 * @returns {Array} Array de días especiales
 */
export const getDiasEspeciales = () => {
  return storageService.getItem(DIAS_ESPECIALES_KEY) || [];
};

/**
 * Guarda los días especiales en el almacenamiento
 * @param {Array} diasEspeciales - Array de días especiales
 */
export const setDiasEspeciales = (diasEspeciales) => {
  return storageService.setItem(DIAS_ESPECIALES_KEY, diasEspeciales);
};

/**
 * Verifica si una fecha es un día especial
 * @param {Date} fecha - Fecha a verificar
 * @param {string} empleado - Nombre del empleado
 * @returns {object|null} Información del día especial si existe
 */
export const esDiaEspecial = (fecha, empleado) => {
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
  const fechaISO = fechaObj.toISOString().split('T')[0];
  
  const diasEspeciales = getDiasEspeciales();
  const diaEspecial = diasEspeciales.find(d => 
    d.fecha === fechaISO && 
    d.empleado === empleado && 
    d.activo
  );
  
  return diaEspecial || null;
};

/**
 * Obtiene días especiales de un período
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @param {string} empleado - Nombre del empleado
 * @returns {Array} Array de días especiales en el período
 */
export const getDiasEspecialesPorPeriodo = (fechaInicio, fechaFin, empleado) => {
  const diasEspeciales = getDiasEspeciales();
  
  return diasEspeciales.filter(dia => {
    if (!dia.activo || dia.empleado !== empleado) return false;
    
    const fechaDia = new Date(dia.fechaCompleta);
    return fechaDia >= fechaInicio && fechaDia <= fechaFin;
  });
};

/**
 * Elimina un día especial
 * @param {string} diaEspecialId - ID del día especial a eliminar
 * @returns {object} Resultado de la operación
 */
export const eliminarDiaEspecial = (diaEspecialId) => {
  try {
    const diasEspeciales = getDiasEspeciales();
    const indice = diasEspeciales.findIndex(d => d.id === diaEspecialId);
    
    if (indice === -1) {
      return {
        success: false,
        message: 'Día especial no encontrado'
      };
    }
    
    diasEspeciales.splice(indice, 1);
    setDiasEspeciales(diasEspeciales);
    
    return {
      success: true,
      message: 'Día especial eliminado correctamente'
    };
    
  } catch (error) {
    console.error('Error al eliminar día especial:', error);
    return {
      success: false,
      error: error.message,
      message: 'Error al eliminar el día especial'
    };
  }
};

/**
 * Desactiva un día especial (soft delete)
 * @param {string} diaEspecialId - ID del día especial a desactivar
 * @returns {object} Resultado de la operación
 */
export const desactivarDiaEspecial = (diaEspecialId) => {
  try {
    const diasEspeciales = getDiasEspeciales();
    const dia = diasEspeciales.find(d => d.id === diaEspecialId);
    
    if (!dia) {
      return {
        success: false,
        message: 'Día especial no encontrado'
      };
    }
    
    dia.activo = false;
    dia.fechaDesactivacion = new Date().toISOString();
    
    setDiasEspeciales(diasEspeciales);
    
    return {
      success: true,
      message: 'Día especial desactivado correctamente'
    };
    
  } catch (error) {
    console.error('Error al desactivar día especial:', error);
    return {
      success: false,
      error: error.message,
      message: 'Error al desactivar el día especial'
    };
  }
};

/**
 * Obtiene el nombre para mostrar de un tipo de día especial
 * @param {string} tipo - Tipo de día especial
 * @returns {string} Nombre para mostrar
 */
export const getTipoDisplayName = (tipo) => {
  const nombres = {
    [TIPOS_DIA_ESPECIAL.FESTIVO_MANUAL]: 'Festivo Manual',
    [TIPOS_DIA_ESPECIAL.FIESTA_PERSONAL]: 'Fiesta Personal',
    [TIPOS_DIA_ESPECIAL.BAJA_LABORAL]: 'Baja Laboral',
    [TIPOS_DIA_ESPECIAL.VACACIONES]: 'Vacaciones',
    [TIPOS_DIA_ESPECIAL.PERMISO]: 'Permiso'
  };
  
  return nombres[tipo] || tipo;
};

/**
 * Obtiene el color de badge para un tipo de día especial
 * @param {string} tipo - Tipo de día especial
 * @returns {object} Clases de color para el badge
 */
export const getTipoColorClasses = (tipo) => {
  const colores = {
    [TIPOS_DIA_ESPECIAL.FESTIVO_MANUAL]: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200'
    },
    [TIPOS_DIA_ESPECIAL.FIESTA_PERSONAL]: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200'
    },
    [TIPOS_DIA_ESPECIAL.BAJA_LABORAL]: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200'
    },
    [TIPOS_DIA_ESPECIAL.VACACIONES]: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200'
    },
    [TIPOS_DIA_ESPECIAL.PERMISO]: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200'
    }
  };
  
  return colores[tipo] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200'
  };
};

/**
 * Calcula estadísticas de días especiales
 * @param {Date} fechaInicio - Fecha de inicio del período
 * @param {Date} fechaFin - Fecha de fin del período
 * @param {string} empleado - Nombre del empleado
 * @returns {object} Estadísticas de días especiales
 */
export const getEstadisticasDiasEspeciales = (fechaInicio, fechaFin, empleado) => {
  const diasEspeciales = getDiasEspecialesPorPeriodo(fechaInicio, fechaFin, empleado);
  
  const estadisticas = {
    total: diasEspeciales.length,
    totalHoras: diasEspeciales.reduce((total, dia) => total + dia.horas, 0),
    porTipo: {}
  };
  
  // Agrupar por tipo
  diasEspeciales.forEach(dia => {
    if (!estadisticas.porTipo[dia.tipo]) {
      estadisticas.porTipo[dia.tipo] = {
        cantidad: 0,
        horas: 0,
        registros: []
      };
    }
    
    estadisticas.porTipo[dia.tipo].cantidad++;
    estadisticas.porTipo[dia.tipo].horas += dia.horas;
    estadisticas.porTipo[dia.tipo].registros.push(dia);
  });
  
  return estadisticas;
};

/**
 * Verifica si se puede registrar un día especial para una fecha
 * @param {Date} fecha - Fecha a verificar
 * @param {string} empleado - Nombre del empleado
 * @returns {object} Resultado de la verificación
 */
export const puedeRegistrarDiaEspecial = (fecha, empleado) => {
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
  const hoy = new Date();
  
  // No se puede registrar días futuros más allá de 7 días
  const diasFuturosPermitidos = 7;
  const fechaLimite = new Date(hoy);
  fechaLimite.setDate(hoy.getDate() + diasFuturosPermitidos);
  
  if (fechaObj > fechaLimite) {
    return {
      puede: false,
      razon: `No se puede registrar días especiales con más de ${diasFuturosPermitidos} días de anticipación`
    };
  }
  
  // Verificar si ya existe un registro especial
  const diaEspecial = esDiaEspecial(fechaObj, empleado);
  if (diaEspecial) {
    return {
      puede: false,
      razon: `Ya existe un registro especial para este día: ${getTipoDisplayName(diaEspecial.tipo)}`
    };
  }
  
  return {
    puede: true,
    razon: 'Puede registrar día especial'
  };
};
