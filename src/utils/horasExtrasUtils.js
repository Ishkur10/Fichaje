/**
 * Utilidades para gestión de horas extras
 */

import { esDiaLaborable, calcularHorasTeoricas } from './festivosUtils';
import { getDiasEspecialesPorPeriodo, getHorasLaborablesPorDia } from './diasEspecialesUtils';

// Configuración por defecto para horas extras
export const CONFIG_HORAS_EXTRAS = {
  HORAS_SEMANALES_STANDARD: 40,
  HORAS_DIARIAS_STANDARD: 8,
  DIAS_LABORABLES_SEMANA: 5
};

/**
 * Obtiene el primer día de la semana (lunes) para una fecha dada
 * @param {Date} fecha - Fecha de referencia
 * @returns {Date} Primer día de la semana (lunes)
 */
export const obtenerInicioSemana = (fecha) => {
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
  const dia = fechaObj.getDay();
  const diferencia = dia === 0 ? -6 : 1 - dia; // Si es domingo (0), retroceder 6 días; sino, ir al lunes
  
  const inicioSemana = new Date(fechaObj);
  inicioSemana.setDate(fechaObj.getDate() + diferencia);
  inicioSemana.setHours(0, 0, 0, 0);
  
  return inicioSemana;
};

/**
 * Obtiene el último día de la semana (domingo) para una fecha dada
 * @param {Date} fecha - Fecha de referencia
 * @returns {Date} Último día de la semana (domingo)
 */
export const obtenerFinSemana = (fecha) => {
  const inicioSemana = obtenerInicioSemana(fecha);
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);
  
  return finSemana;
};

/**
 * Calcula las horas trabajadas en una semana específica incluyendo días especiales
 * @param {Array} fichajes - Array de fichajes
 * @param {Date} fechaSemana - Cualquier fecha de la semana a calcular
 * @param {object} sesionActiva - Sesión activa si existe
 * @param {string} empleado - Nombre del empleado
 * @returns {object} Información de horas trabajadas en la semana
 */
export const calcularHorasSemana = (fichajes, fechaSemana, sesionActiva = null, empleado = '') => {
  const inicioSemana = obtenerInicioSemana(fechaSemana);
  const finSemana = obtenerFinSemana(fechaSemana);
  
  // Obtener días especiales de la semana
  const diasEspeciales = empleado ? getDiasEspecialesPorPeriodo(inicioSemana, finSemana, empleado) : [];
  
  // Filtrar fichajes de la semana
  const fichajesSemana = fichajes.filter(fichaje => {
    const fechaFichaje = new Date(fichaje.fecha);
    return fechaFichaje >= inicioSemana && fechaFichaje <= finSemana;
  });
  
  // Agrupar fichajes por día
  const fichajesPorDia = {};
  fichajesSemana.forEach(fichaje => {
    const fecha = new Date(fichaje.fecha).toLocaleDateString();
    if (!fichajesPorDia[fecha]) {
      fichajesPorDia[fecha] = [];
    }
    fichajesPorDia[fecha].push(fichaje);
  });
  
  // Incluir sesión activa si corresponde a esta semana
  if (sesionActiva) {
    const fechaSesion = new Date(sesionActiva.fechaInicio);
    if (fechaSesion >= inicioSemana && fechaSesion <= finSemana) {
      const fecha = fechaSesion.toLocaleDateString();
      if (!fichajesPorDia[fecha]) {
        fichajesPorDia[fecha] = [];
      }
      
      // Añadir entrada de la sesión si no está ya
      const entradaExiste = fichajesPorDia[fecha].some(f => f.id === sesionActiva.id);
      if (!entradaExiste) {
        fichajesPorDia[fecha].push({
          id: sesionActiva.id,
          tipo: 'entrada',
          fecha: sesionActiva.fechaInicio,
          empleado: sesionActiva.empleado
        });
      }
      
      // Añadir salida virtual
      fichajesPorDia[fecha].push({
        id: 'virtual-' + sesionActiva.id,
        tipo: 'salida',
        fecha: new Date().toISOString(),
        empleado: sesionActiva.empleado,
        entradaId: sesionActiva.id,
        tiempoTrabajado: sesionActiva.tiempoAcumulado || 0,
        virtual: true
      });
    }
  }
  
  let totalSegundosSemana = 0;
  const detallesPorDia = [];
  
  // Primero, procesar días especiales (que cuentan como horas trabajadas)
  diasEspeciales.forEach(diaEspecial => {
    const fechaDia = new Date(diaEspecial.fechaCompleta).toLocaleDateString();
    const fechaObj = new Date(diaEspecial.fechaCompleta);
    
    // Verificar que no haya fichajes normales ese día
    const tieneFichajes = Object.keys(fichajesPorDia).includes(fechaDia);
    
    if (!tieneFichajes) {
      const segundosEspeciales = diaEspecial.horas * 3600; // Convertir horas a segundos
      totalSegundosSemana += segundosEspeciales;
      
      const infoLaborable = esDiaLaborable(fechaObj);
      
      detallesPorDia.push({
        fecha: fechaDia,
        fechaObj,
        entrada: diaEspecial.fechaCompleta,
        salida: diaEspecial.fechaCompleta,
        segundosTrabajados: segundosEspeciales,
        horasTrabajadas: diaEspecial.horas,
        esLaborable: infoLaborable.esLaborable,
        razonNoLaborable: infoLaborable.esLaborable ? null : infoLaborable.razon,
        incluyeSesionActiva: false,
        festivo: infoLaborable.razon === 'festivo' ? infoLaborable.festivo : null,
        esDiaEspecial: true,
        tipoDiaEspecial: diaEspecial.tipo,
        motivoDiaEspecial: diaEspecial.motivo
      });
    }
  });
  
  // Luego, calcular horas por cada día con fichajes normales
  Object.keys(fichajesPorDia).forEach(fecha => {
    const fichajesDia = fichajesPorDia[fecha];
    fichajesDia.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    let entrada = null;
    let salida = null;
    
    // Encontrar primera entrada y última salida del día
    for (const fichaje of fichajesDia) {
      if (fichaje.tipo === 'entrada' && (!entrada || new Date(fichaje.fecha) < new Date(entrada.fecha))) {
        entrada = fichaje;
      }
      if (fichaje.tipo === 'salida' && (!salida || new Date(fichaje.fecha) > new Date(salida.fecha))) {
        salida = fichaje;
      }
    }
    
    if (entrada && salida) {
      let segundosTrabajados = 0;
      
      if (salida.tiempoTrabajado !== undefined) {
        // Usar tiempo calculado si está disponible
        segundosTrabajados = salida.tiempoTrabajado;
      } else {
        // Calcular tiempo basado en entrada y salida
        const fechaEntrada = new Date(entrada.fecha);
        const fechaSalida = new Date(salida.fecha);
        segundosTrabajados = (fechaSalida - fechaEntrada) / 1000;
      }
      
      totalSegundosSemana += segundosTrabajados;
      
      const fechaObj = new Date(entrada.fecha);
      const infoLaborable = esDiaLaborable(fechaObj);
      
      detallesPorDia.push({
      fecha,
      fechaObj,
      entrada: entrada.fecha,
      salida: salida.fecha,
      segundosTrabajados,
      horasTrabajadas: segundosTrabajados / 3600,
      esLaborable: infoLaborable.esLaborable,
      razonNoLaborable: infoLaborable.esLaborable ? null : infoLaborable.razon,
      incluyeSesionActiva: salida.virtual || false,
      festivo: infoLaborable.razon === 'festivo' ? infoLaborable.festivo : null,
        esDiaEspecial: false
        });
    }
  });
  
  const horasSemanales = totalSegundosSemana / 3600;
  const horasExtras = Math.max(0, horasSemanales - CONFIG_HORAS_EXTRAS.HORAS_SEMANALES_STANDARD);
  
  // Calcular horas teóricas de la semana
  const horasTeoricas = calcularHorasTeoricas(inicioSemana, finSemana);
  
  return {
    inicioSemana,
    finSemana,
    semanaISO: obtenerNumeroSemanaISO(fechaSemana),
    año: fechaSemana.getFullYear(),
    totalSegundos: totalSegundosSemana,
    horasSemanales,
    horasExtras,
    tieneHorasExtras: horasExtras > 0,
    diasTrabajados: detallesPorDia.length,
    diasLaborables: horasTeoricas.diasLaborables,
    diasFestivos: detallesPorDia.filter(d => d.razonNoLaborable === 'festivo').length,
    diasEspeciales: detallesPorDia.filter(d => d.esDiaEspecial).length,
    detallesPorDia,
    horasTeoricas: horasTeoricas.horasTeoricas,
    diferenciaHorasTeoricas: horasSemanales - horasTeoricas.horasTeoricas
  };
};

/**
 * Obtiene el número de semana ISO para una fecha
 * @param {Date} fecha - Fecha de referencia
 * @returns {number} Número de semana ISO
 */
export const obtenerNumeroSemanaISO = (fecha) => {
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
  const primerJueves = new Date(fechaObj.getFullYear(), 0, 4);
  
  // Encontrar el primer jueves del año
  primerJueves.setDate(primerJueves.getDate() - (primerJueves.getDay() + 6) % 7);
  
  // Calcular diferencia en semanas
  const diasDiferencia = Math.floor((fechaObj - primerJueves) / (24 * 60 * 60 * 1000));
  return Math.floor(diasDiferencia / 7) + 1;
};

/**
 * Calcula el resumen de horas extras acumuladas incluyendo días especiales
 * @param {Array} fichajes - Array de todos los fichajes
 * @param {object} sesionActiva - Sesión activa si existe
 * @param {Date} fechaInicio - Fecha de inicio del período (opcional)
 * @param {Date} fechaFin - Fecha de fin del período (opcional)
 * @param {string} empleado - Nombre del empleado
 * @returns {object} Resumen de horas extras
 */
export const calcularResumenHorasExtras = (fichajes, sesionActiva = null, fechaInicio = null, fechaFin = null, empleado = '') => {
  // Si no se especifican fechas, calcular para todo el período disponible
  if (!fechaInicio || !fechaFin) {
    if (fichajes.length === 0 && !sesionActiva) {
      return {
        horasExtrasTotal: 0,
        semanas: [],
        totalSegundosExtras: 0,
        resumenPorMes: {}
      };
    }
    
    const fechas = fichajes.map(f => new Date(f.fecha));
    if (sesionActiva) {
      fechas.push(new Date(sesionActiva.fechaInicio));
    }
    
    // También incluir fechas de días especiales
    if (empleado) {
      const diasEspeciales = getDiasEspecialesPorPeriodo(null, null, empleado);
      diasEspeciales.forEach(dia => {
        fechas.push(new Date(dia.fechaCompleta));
      });
    }
    
    if (fechas.length === 0) {
      return {
        horasExtrasTotal: 0,
        semanas: [],
        totalSegundosExtras: 0,
        resumenPorMes: {}
      };
    }
    
    fechaInicio = new Date(Math.min(...fechas));
    fechaFin = new Date(Math.max(...fechas));
  }
  
  // Obtener todas las semanas en el rango
  const semanas = [];
  const fechaActual = new Date(fechaInicio);
  
  while (fechaActual <= fechaFin) {
    const horasSemana = calcularHorasSemana(fichajes, fechaActual, sesionActiva, empleado);
    semanas.push(horasSemana);
    
    // Avanzar a la siguiente semana
    fechaActual.setDate(fechaActual.getDate() + 7);
  }
  
  // Eliminar duplicados basándose en la semana ISO y año
  const semanasUnicas = semanas.filter((semana, index, array) => {
    return index === array.findIndex(s => 
      s.semanaISO === semana.semanaISO && s.año === semana.año
    );
  });
  
  // Calcular totales
  const totalSegundosExtras = semanasUnicas.reduce((total, semana) => {
    return total + (semana.horasExtras * 3600);
  }, 0);
  
  const horasExtrasTotal = totalSegundosExtras / 3600;
  
  // Agrupar por mes para el resumen
  const resumenPorMes = {};
  semanasUnicas.forEach(semana => {
    const mes = semana.inicioSemana.toLocaleDateString('es', { year: 'numeric', month: 'long' });
    
    if (!resumenPorMes[mes]) {
      resumenPorMes[mes] = {
        horasExtras: 0,
        semanas: 0,
        mes: mes
      };
    }
    
    resumenPorMes[mes].horasExtras += semana.horasExtras;
    resumenPorMes[mes].semanas += 1;
  });
  
  return {
    horasExtrasTotal,
    totalSegundosExtras,
    semanas: semanasUnicas.sort((a, b) => b.inicioSemana - a.inicioSemana),
    resumenPorMes: Object.values(resumenPorMes)
  };
};

/**
 * Formatea segundos a formato de horas y minutos
 * @param {number} segundos - Segundos a formatear
 * @returns {object} Objeto con horas y minutos
 */
export const formatearTiempoExtras = (segundos) => {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  
  return {
    horas,
    minutos,
    texto: `${horas}h ${minutos}m`,
    textoCorto: `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
  };
};

/**
 * Determina el tipo de día para mostrar en la interfaz
 * @param {object} detalleDia - Detalle del día del cálculo de horas
 * @returns {object} Información sobre el tipo de día
 */
export const obtenerTipoDia = (detalleDia) => {
  if (detalleDia.esLaborable) {
    return {
      tipo: 'laborable',
      etiqueta: 'Día laborable',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    };
  } else if (detalleDia.razonNoLaborable === 'festivo') {
    return {
      tipo: 'festivo',
      etiqueta: detalleDia.festivo?.nombre || 'Día festivo',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    };
  } else {
    return {
      tipo: 'fin-semana',
      etiqueta: 'Fin de semana',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    };
  }
};
