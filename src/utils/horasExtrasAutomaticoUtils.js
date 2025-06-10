/**
 * Servicio automático para gestión de horas extras
 * Se ejecuta automáticamente al registrar salidas para calcular horas extras
 */

import { calcularHorasSemana, CONFIG_HORAS_EXTRAS } from './horasExtrasUtils';
import storageService from '../services/storageService';

const HORAS_EXTRAS_LOG_KEY = 'horasExtrasLog';

/**
 * Procesa automáticamente las horas extras al registrar una salida
 * @param {Array} fichajes - Array de todos los fichajes
 * @param {object} salidaRegistrada - Objeto de la salida recién registrada
 * @param {object} sesionActiva - Información de la sesión que se cerró
 * @returns {object} Resultado del procesamiento
 */
export const procesarHorasExtrasAutomatico = (fichajes, salidaRegistrada, sesionActiva = null) => {
  try {
    console.log('Procesando horas extras automáticamente...');
    
    // Obtener el empleado de la salida registrada
    const empleado = salidaRegistrada.empleado || '';
    
    // Obtener la fecha de la salida para calcular la semana
    const fechaSalida = new Date(salidaRegistrada.fecha);
    
    // Calcular horas de la semana incluyendo días especiales
    const horasSemana = calcularHorasSemana(fichajes, fechaSalida, null, empleado);
    
    console.log(`Semana ${horasSemana.semanaISO}/${horasSemana.año}:`, {
      horasSemanales: horasSemana.horasSemanales,
      horasExtras: horasSemana.horasExtras,
      tieneHorasExtras: horasSemana.tieneHorasExtras
    });
    
    // Si hay horas extras, registrarlas
    if (horasSemana.tieneHorasExtras && horasSemana.horasExtras > 0) {
      const registroHorasExtras = registrarHorasExtras(horasSemana, salidaRegistrada);
      
      let mensaje = `¡Felicidades! Has acumulado ${horasSemana.horasExtras.toFixed(1)} horas extras esta semana.`;
      
      // Incluir información sobre días especiales si los hay
      if (horasSemana.diasEspeciales > 0) {
        mensaje += ` (Incluye ${horasSemana.diasEspeciales} día${horasSemana.diasEspeciales > 1 ? 's' : ''} especial${horasSemana.diasEspeciales > 1 ? 'es' : ''})`;
      }
      
      return {
        success: true,
        horasExtrasDetectadas: true,
        horasExtras: horasSemana.horasExtras,
        semana: `${horasSemana.semanaISO}/${horasSemana.año}`,
        registro: registroHorasExtras,
        mensaje
      };
    }
    
    let mensaje = `Semana completada con ${horasSemana.horasSemanales.toFixed(1)} horas trabajadas.`;
    
    // Incluir información sobre días especiales si los hay
    if (horasSemana.diasEspeciales > 0) {
      mensaje += ` (Incluye ${horasSemana.diasEspeciales} día${horasSemana.diasEspeciales > 1 ? 's' : ''} especial${horasSemana.diasEspeciales > 1 ? 'es' : ''})`;
    }
    
    return {
      success: true,
      horasExtrasDetectadas: false,
      horasSemanales: horasSemana.horasSemanales,
      semana: `${horasSemana.semanaISO}/${horasSemana.año}`,
      mensaje
    };
    
  } catch (error) {
    console.error('Error al procesar horas extras automáticamente:', error);
    return {
      success: false,
      error: error.message,
      mensaje: 'Error al calcular las horas extras de la semana.'
    };
  }
};

/**
 * Registra las horas extras en el log del sistema
 * @param {object} horasSemana - Información de las horas de la semana
 * @param {object} salidaRegistrada - Salida que completó la semana
 * @returns {object} Registro creado
 */
const registrarHorasExtras = (horasSemana, salidaRegistrada) => {
  const log = getHorasExtrasLog();
  
  // Verificar si ya existe un registro para esta semana
  const registroExistente = log.find(r => 
    r.semanaISO === horasSemana.semanaISO && 
    r.año === horasSemana.año
  );
  
  if (registroExistente) {
    console.log('Ya existe un registro de horas extras para esta semana, actualizando...');
    
    // Actualizar registro existente
    registroExistente.horasExtras = horasSemana.horasExtras;
    registroExistente.horasSemanales = horasSemana.horasSemanales;
    registroExistente.ultimaActualizacion = new Date().toISOString();
    registroExistente.salidaQueCerroSemana = {
      id: salidaRegistrada.id,
      fecha: salidaRegistrada.fecha,
      empleado: salidaRegistrada.empleado
    };
    
    setHorasExtrasLog(log);
    return registroExistente;
  }
  
  // Crear nuevo registro
  const nuevoRegistro = {
    id: `extras_${horasSemana.año}_${horasSemana.semanaISO}_${Date.now()}`,
    semanaISO: horasSemana.semanaISO,
    año: horasSemana.año,
    fechaInicio: horasSemana.inicioSemana.toISOString(),
    fechaFin: horasSemana.finSemana.toISOString(),
    horasSemanales: horasSemana.horasSemanales,
    horasExtras: horasSemana.horasExtras,
    diasTrabajados: horasSemana.diasTrabajados,
    diasFestivos: horasSemana.diasFestivos,
    horasTeoricas: horasSemana.horasTeoricas,
    empleado: salidaRegistrada.empleado,
    fechaRegistro: new Date().toISOString(),
    salidaQueCerroSemana: {
      id: salidaRegistrada.id,
      fecha: salidaRegistrada.fecha,
      empleado: salidaRegistrada.empleado
    },
    estado: 'pendiente', // pendiente, pagado, compensado
    observaciones: `Horas extras generadas automáticamente al superar ${CONFIG_HORAS_EXTRAS.HORAS_SEMANALES_STANDARD}h semanales`
  };
  
  log.push(nuevoRegistro);
  setHorasExtrasLog(log);
  
  console.log('Nuevo registro de horas extras creado:', nuevoRegistro);
  
  return nuevoRegistro;
};

/**
 * Obtiene el log de horas extras del almacenamiento local
 * @returns {Array} Array de registros de horas extras
 */
export const getHorasExtrasLog = () => {
  return storageService.getItem(HORAS_EXTRAS_LOG_KEY) || [];
};

/**
 * Guarda el log de horas extras en el almacenamiento local
 * @param {Array} log - Array de registros a guardar
 */
export const setHorasExtrasLog = (log) => {
  return storageService.setItem(HORAS_EXTRAS_LOG_KEY, log);
};

/**
 * Obtiene resumen de horas extras acumuladas
 * @param {Date} fechaInicio - Fecha de inicio del período (opcional)
 * @param {Date} fechaFin - Fecha de fin del período (opcional)
 * @returns {object} Resumen de horas extras
 */
export const getResumenHorasExtrasLog = (fechaInicio = null, fechaFin = null) => {
  const log = getHorasExtrasLog();
  
  let logFiltrado = log;
  if (fechaInicio || fechaFin) {
    logFiltrado = log.filter(registro => {
      const fechaRegistro = new Date(registro.fechaRegistro);
      
      if (fechaInicio && fechaRegistro < fechaInicio) return false;
      if (fechaFin && fechaRegistro > fechaFin) return false;
      
      return true;
    });
  }
  
  const totalHorasExtras = logFiltrado.reduce((total, registro) => {
    return total + (registro.horasExtras || 0);
  }, 0);
  
  const resumenPorEstado = {
    pendiente: logFiltrado.filter(r => r.estado === 'pendiente'),
    pagado: logFiltrado.filter(r => r.estado === 'pagado'),
    compensado: logFiltrado.filter(r => r.estado === 'compensado')
  };
  
  const resumenPorMes = {};
  logFiltrado.forEach(registro => {
    const fecha = new Date(registro.fechaRegistro);
    const mesAño = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!resumenPorMes[mesAño]) {
      resumenPorMes[mesAño] = {
        mes: fecha.toLocaleDateString('es', { year: 'numeric', month: 'long' }),
        horasExtras: 0,
        registros: 0
      };
    }
    
    resumenPorMes[mesAño].horasExtras += registro.horasExtras;
    resumenPorMes[mesAño].registros += 1;
  });
  
  return {
    totalRegistros: logFiltrado.length,
    totalHorasExtras,
    resumenPorEstado,
    resumenPorMes: Object.values(resumenPorMes),
    registrosDetallados: logFiltrado.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))
  };
};

/**
 * Actualiza el estado de un registro de horas extras
 * @param {string} registroId - ID del registro a actualizar
 * @param {string} nuevoEstado - Nuevo estado (pendiente, pagado, compensado)
 * @param {string} observaciones - Observaciones adicionales
 * @returns {object} Resultado de la operación
 */
export const actualizarEstadoHorasExtras = (registroId, nuevoEstado, observaciones = '') => {
  try {
    const log = getHorasExtrasLog();
    const indiceRegistro = log.findIndex(r => r.id === registroId);
    
    if (indiceRegistro === -1) {
      return {
        success: false,
        message: 'Registro de horas extras no encontrado'
      };
    }
    
    log[indiceRegistro].estado = nuevoEstado;
    log[indiceRegistro].ultimaActualizacion = new Date().toISOString();
    
    if (observaciones) {
      if (!log[indiceRegistro].historialObservaciones) {
        log[indiceRegistro].historialObservaciones = [];
      }
      
      log[indiceRegistro].historialObservaciones.push({
        fecha: new Date().toISOString(),
        estado: nuevoEstado,
        observacion: observaciones
      });
      
      log[indiceRegistro].observaciones = observaciones;
    }
    
    setHorasExtrasLog(log);
    
    return {
      success: true,
      registro: log[indiceRegistro],
      message: `Estado actualizado a "${nuevoEstado}" correctamente`
    };
    
  } catch (error) {
    console.error('Error al actualizar estado de horas extras:', error);
    return {
      success: false,
      error: error.message,
      message: 'Error al actualizar el estado del registro'
    };
  }
};

/**
 * Elimina un registro de horas extras del log
 * @param {string} registroId - ID del registro a eliminar
 * @returns {object} Resultado de la operación
 */
export const eliminarRegistroHorasExtras = (registroId) => {
  try {
    const log = getHorasExtrasLog();
    const logFiltrado = log.filter(r => r.id !== registroId);
    
    if (log.length === logFiltrado.length) {
      return {
        success: false,
        message: 'Registro de horas extras no encontrado'
      };
    }
    
    setHorasExtrasLog(logFiltrado);
    
    return {
      success: true,
      message: 'Registro eliminado correctamente'
    };
    
  } catch (error) {
    console.error('Error al eliminar registro de horas extras:', error);
    return {
      success: false,
      error: error.message,
      message: 'Error al eliminar el registro'
    };
  }
};

/**
 * Verifica si una semana específica tiene horas extras registradas
 * @param {number} semanaISO - Número de semana ISO
 * @param {number} año - Año
 * @returns {object|null} Registro de horas extras si existe
 */
export const verificarHorasExtrasSemana = (semanaISO, año) => {
  const log = getHorasExtrasLog();
  return log.find(r => r.semanaISO === semanaISO && r.año === año) || null;
};
