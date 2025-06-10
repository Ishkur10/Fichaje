/**
 * Utilidades para gestión de días festivos
 */

// Días festivos fijos en España (formato MM-DD)
export const FESTIVOS_FIJOS = [
  '01-01', // Año Nuevo
  '01-06', // Epifanía del Señor
  '05-01', // Día del Trabajador
  '08-15', // Asunción de la Virgen
  '10-12', // Fiesta Nacional de España
  '11-01', // Todos los Santos
  '12-06', // Día de la Constitución
  '12-08', // Inmaculada Concepción
  '12-25', // Navidad
];

// Días festivos autonómicos de Cataluña (formato MM-DD)
export const FESTIVOS_CATALUÑA = [
  '04-23', // Sant Jordi
  '06-24', // Sant Joan
  '09-11', // Diada Nacional de Catalunya
  '12-26', // San Esteban
];

/**
 * Calcula la fecha de Pascua para un año dado
 * @param {number} año - Año para calcular la Pascua
 * @returns {Date} Fecha de Pascua
 */
export const calcularPascua = (año) => {
  // Algoritmo de cálculo de Pascua de Gauss
  const a = año % 19;
  const b = Math.floor(año / 100);
  const c = año % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(año, mes - 1, dia);
};

/**
 * Obtiene los días festivos variables para un año dado
 * @param {number} año - Año para calcular los festivos
 * @returns {Array<Date>} Array de fechas festivas variables
 */
export const obtenerFestivosVariables = (año) => {
  const pascua = calcularPascua(año);
  const festivosVariables = [];
  
  // Viernes Santo (2 días antes de Pascua)
  const viernesSanto = new Date(pascua);
  viernesSanto.setDate(pascua.getDate() - 2);
  festivosVariables.push(viernesSanto);
  
  // Lunes de Pascua (1 día después de Pascua)
  const lunesPascua = new Date(pascua);
  lunesPascua.setDate(pascua.getDate() + 1);
  festivosVariables.push(lunesPascua);
  
  // Lunes de Pentecostés (50 días después de Pascua)
  const lunesPentecostes = new Date(pascua);
  lunesPentecostes.setDate(pascua.getDate() + 50);
  festivosVariables.push(lunesPentecostes);
  
  return festivosVariables;
};

/**
 * Verifica si una fecha es festivo
 * @param {Date} fecha - Fecha a verificar
 * @param {boolean} incluirCataluña - Si incluir festivos de Cataluña
 * @returns {object} Información sobre si es festivo y tipo
 */
export const esFestivo = (fecha, incluirCataluña = true) => {
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
  const año = fechaObj.getFullYear();
  const mesString = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
  const diaString = fechaObj.getDate().toString().padStart(2, '0');
  const fechaFormato = `${mesString}-${diaString}`;
  
  // Verificar festivos fijos nacionales
  if (FESTIVOS_FIJOS.includes(fechaFormato)) {
    const nombres = {
      '01-01': 'Año Nuevo',
      '01-06': 'Epifanía del Señor',
      '05-01': 'Día del Trabajador',
      '08-15': 'Asunción de la Virgen',
      '10-12': 'Fiesta Nacional de España',
      '11-01': 'Todos los Santos',
      '12-06': 'Día de la Constitución',
      '12-08': 'Inmaculada Concepción',
      '12-25': 'Navidad'
    };
    
    return {
      esFestivo: true,
      tipo: 'nacional',
      nombre: nombres[fechaFormato]
    };
  }
  
  // Verificar festivos autonómicos de Cataluña
  if (incluirCataluña && FESTIVOS_CATALUÑA.includes(fechaFormato)) {
    const nombres = {
      '04-23': 'Sant Jordi',
      '06-24': 'Sant Joan',
      '09-11': 'Diada Nacional de Catalunya',
      '12-26': 'San Esteban'
    };
    
    return {
      esFestivo: true,
      tipo: 'autonómico',
      nombre: nombres[fechaFormato]
    };
  }
  
  // Verificar festivos variables
  const festivosVariables = obtenerFestivosVariables(año);
  for (const festivo of festivosVariables) {
    if (fechaObj.toDateString() === festivo.toDateString()) {
      let nombre = '';
      const pascua = calcularPascua(año);
      
      if (festivo.getTime() === new Date(pascua.getTime() - 2 * 24 * 60 * 60 * 1000).getTime()) {
        nombre = 'Viernes Santo';
      } else if (festivo.getTime() === new Date(pascua.getTime() + 24 * 60 * 60 * 1000).getTime()) {
        nombre = 'Lunes de Pascua';
      } else if (festivo.getTime() === new Date(pascua.getTime() + 50 * 24 * 60 * 60 * 1000).getTime()) {
        nombre = 'Lunes de Pentecostés';
      }
      
      return {
        esFestivo: true,
        tipo: 'variable',
        nombre
      };
    }
  }
  
  return {
    esFestivo: false,
    tipo: null,
    nombre: null
  };
};

/**
 * Obtiene todos los festivos de un año
 * @param {number} año - Año para obtener festivos
 * @param {boolean} incluirCataluña - Si incluir festivos de Cataluña
 * @returns {Array<object>} Array de objetos con información de festivos
 */
export const obtenerFestivosAño = (año, incluirCataluña = true) => {
  const festivos = [];
  
  // Añadir festivos fijos nacionales
  FESTIVOS_FIJOS.forEach(fechaFormato => {
    const [mes, dia] = fechaFormato.split('-').map(Number);
    const fecha = new Date(año, mes - 1, dia);
    const info = esFestivo(fecha, false);
    festivos.push({
      fecha,
      ...info
    });
  });
  
  // Añadir festivos autonómicos si se solicita
  if (incluirCataluña) {
    FESTIVOS_CATALUÑA.forEach(fechaFormato => {
      const [mes, dia] = fechaFormato.split('-').map(Number);
      const fecha = new Date(año, mes - 1, dia);
      const info = esFestivo(fecha, false);
      info.tipo = 'autonómico';
      const nombres = {
        '04-23': 'Sant Jordi',
        '06-24': 'Sant Joan',
        '09-11': 'Diada Nacional de Catalunya',
        '12-26': 'San Esteban'
      };
      info.nombre = nombres[fechaFormato];
      festivos.push({
        fecha,
        ...info
      });
    });
  }
  
  // Añadir festivos variables
  const festivosVariables = obtenerFestivosVariables(año);
  festivosVariables.forEach(fecha => {
    const info = esFestivo(fecha, false);
    info.tipo = 'variable';
    festivos.push({
      fecha,
      ...info
    });
  });
  
  // Ordenar por fecha
  festivos.sort((a, b) => a.fecha - b.fecha);
  
  return festivos;
};

/**
 * Verifica si una fecha es día laborable (lunes a viernes, excluyendo festivos)
 * @param {Date} fecha - Fecha a verificar
 * @param {boolean} incluirCataluña - Si incluir festivos de Cataluña
 * @returns {object} Información sobre si es día laborable
 */
export const esDiaLaborable = (fecha, incluirCataluña = true) => {
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
  const diaSemana = fechaObj.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
  
  // Verificar si es fin de semana
  if (diaSemana === 0 || diaSemana === 6) {
    return {
      esLaborable: false,
      razon: 'fin de semana',
      diaSemana: diaSemana === 0 ? 'domingo' : 'sábado'
    };
  }
  
  // Verificar si es festivo
  const infoFestivo = esFestivo(fechaObj, incluirCataluña);
  if (infoFestivo.esFestivo) {
    return {
      esLaborable: false,
      razon: 'festivo',
      festivo: infoFestivo
    };
  }
  
  return {
    esLaborable: true,
    razon: 'día laborable'
  };
};

/**
 * Calcula las horas teóricas que se deberían trabajar en un período
 * @param {Date} fechaInicio - Fecha de inicio del período
 * @param {Date} fechaFin - Fecha de fin del período
 * @param {number} horasPorDia - Horas teóricas por día laborable (por defecto 8)
 * @param {boolean} incluirCataluña - Si incluir festivos de Cataluña
 * @returns {object} Información sobre horas teóricas
 */
export const calcularHorasTeoricas = (fechaInicio, fechaFin, horasPorDia = 8, incluirCataluña = true) => {
  const inicio = fechaInicio instanceof Date ? fechaInicio : new Date(fechaInicio);
  const fin = fechaFin instanceof Date ? fechaFin : new Date(fechaFin);
  
  let diasLaborables = 0;
  let diasFestivos = 0;
  let diasFinSemana = 0;
  
  const fechaActual = new Date(inicio);
  while (fechaActual <= fin) {
    const infoLaborable = esDiaLaborable(fechaActual, incluirCataluña);
    
    if (infoLaborable.esLaborable) {
      diasLaborables++;
    } else if (infoLaborable.razon === 'festivo') {
      diasFestivos++;
    } else if (infoLaborable.razon === 'fin de semana') {
      diasFinSemana++;
    }
    
    fechaActual.setDate(fechaActual.getDate() + 1);
  }
  
  return {
    diasLaborables,
    diasFestivos,
    diasFinSemana,
    diasTotales: diasLaborables + diasFestivos + diasFinSemana,
    horasTeoricas: diasLaborables * horasPorDia,
    horasPorDia
  };
};
