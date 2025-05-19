import storageService from './storageService';
import { calcularEstadisticas } from '../utils/estadisticasUtils';

const FICHAJES_KEY = 'fichajes';
const EMPLEADO_KEY = 'nombreEmpleado';
const SESION_ACTIVA_KEY = 'sesionActiva';

const fichajeService = {
  getFichajes: () => {
    return storageService.getItem(FICHAJES_KEY) || [];
  },

  getNombreEmpleado: () => {
    return storageService.getItem(EMPLEADO_KEY) || '';
  },


  editarFichaje: (fichajeId, nuevaFecha) => {
    const fichajes = fichajeService.getFichajes();
    const fichajeIndex = fichajes.findIndex(f => f.id === fichajeId);

    if (fichajeIndex === -1) {
      return { success: false, message: 'Fichaje no encontrado' };
    }
    const nuevosFichajes = [...fichajes];
    nuevosFichajes[fichajeIndex] = {
      ...nuevosFichajes[fichajeIndex],
      fecha: nuevaFecha.toISOString()
    };

    storageService.setItem(FICHAJES_KEY, nuevosFichajes);
    return {
      success: true,
      fichaje: nuevosFichajes[fichajeIndex],
      fichajes: nuevosFichajes
    };
  },

  setNombreEmpleado: (nombre) => {
    return storageService.setItem(EMPLEADO_KEY, nombre);
  },


   getSesionActiva: () => {
    const sesion = storageService.getItem(SESION_ACTIVA_KEY);
    if (sesion) {

      if (sesion.tiempoAcumulado === undefined) {
        sesion.tiempoAcumulado = 0;
      }
      
 
      if (!sesion.ultimaActualizacion) {
        sesion.ultimaActualizacion = new Date().toISOString();
      }
      

      if (sesion.pausada === undefined) {
        sesion.pausada = false;
      }
    }
    
    return sesion;
  },

  setSesionActiva: (sesion) => {
    const sesionActualizada = {
      ...sesion,
      ultimaActualizacion: new Date().toISOString()
    };
    
    return storageService.setItem(SESION_ACTIVA_KEY, sesionActualizada);
  },

  clearSesionActiva: () => {
    return storageService.removeItem(SESION_ACTIVA_KEY);
  },
  

  togglePausaSesion: (pausar) => {
    const sesion = fichajeService.getSesionActiva();
    
    if (!sesion) {
      return { success: false, message: 'No hay sesión activa' };
    }
    
    if (pausar === sesion.pausada) {

      return { success: true, sesion };
    }
    
    const ahora = new Date();
    let nuevaSesion = { ...sesion };
    
    if (pausar) {

      const ultimaActualizacion = new Date(sesion.ultimaActualizacion);
      const segundosDesdeUltimaActualizacion = (ahora - ultimaActualizacion) / 1000;
      

      nuevaSesion.tiempoAcumulado = (sesion.tiempoAcumulado || 0) + segundosDesdeUltimaActualizacion;
    }
    

    nuevaSesion.pausada = pausar;
    nuevaSesion.ultimaActualizacion = ahora.toISOString();
    
    fichajeService.setSesionActiva(nuevaSesion);
    
    return { success: true, sesion: nuevaSesion };
  },
  

calcularTiempoSesionActiva: () => {
  const sesion = fichajeService.getSesionActiva();
  
  if (!sesion) {
    return 0;
  }
  
  if (!sesion.fechaInicio) {
    console.warn("Sesión sin fecha de inicio");
    return 0;
  }
  
  let tiempoAcumulado = sesion.tiempoAcumulado || 0;
  
  if (sesion.pausada) {
    console.log(`Sesión pausada, tiempo acumulado: ${tiempoAcumulado}s`);
    return tiempoAcumulado;
  }
  
  const ultimaActualizacion = sesion.ultimaActualizacion 
    ? new Date(sesion.ultimaActualizacion) 
    : new Date(sesion.fechaInicio);
  
  const ahora = new Date();
  const segundosAdicionales = Math.max(0, (ahora - ultimaActualizacion) / 1000);
  
  const tiempoTotal = tiempoAcumulado + segundosAdicionales;
  
  console.log(`Tiempo acumulado: ${tiempoAcumulado}s + adicional: ${segundosAdicionales.toFixed(1)}s = total: ${tiempoTotal.toFixed(1)}s`);
  
  fichajeService.setSesionActiva({
    ...sesion,
    ultimaActualizacion: ahora.toISOString(),
    tiempoAcumulado: tiempoTotal 
  });
  
  return tiempoTotal;
},

registrarFichaje: (tipo, nombre, datos = null) => {
  const fichajes = fichajeService.getFichajes();
  
  const nuevoId = Date.now();

  const nuevoFichaje = {
    id: nuevoId,
    tipo,
    fecha: new Date().toISOString(),
    empleado: nombre || 'Sin nombre'
  };
  

  if (tipo === 'salida' && datos) {
    nuevoFichaje.tiempoTrabajado = datos.tiempoTrabajado;
    nuevoFichaje.tiempoFormateado = datos.tiempoFormateado;  
    nuevoFichaje.entradaId = datos.entradaId;                  
  }
  
  const nuevosFichajes = [nuevoFichaje, ...fichajes];
  storageService.setItem(FICHAJES_KEY, nuevosFichajes);
  
  console.log(`Fichaje de ${tipo} registrado:`, nuevoFichaje);
  
  return { success: true, fichaje: nuevoFichaje, fichajes: nuevosFichajes };
},


  eliminarFichaje: (fichajeId) => {
    const fichajes = fichajeService.getFichajes();
    const nuevosFichajes = fichajes.filter(f => f.id !== fichajeId);

    if (fichajes.length === nuevosFichajes.length) {
      return { success: false, message: 'Fichaje no encontrado' };
    }

    storageService.setItem(FICHAJES_KEY, nuevosFichajes);
    return { success: true, fichajes: nuevosFichajes };
  },


  getFichajesPorFecha: (fechaInicio, fechaFin) => {
    const fichajes = fichajeService.getFichajes();

    return fichajes.filter(fichaje => {
      const fechaFichaje = new Date(fichaje.fecha);
      return fechaFichaje >= fechaInicio && fechaFichaje <= fechaFin;
    });
  },

   getEstadisticasDetalladas: (fechaInicio = null, fechaFin = null, sesionActiva = null) => {
    const fichajes = fichajeService.getFichajes();
    
    // Si hay una sesión activa, crear un fichaje virtual de salida para calcular estadísticas
    let fichajesConSesionActual = [...fichajes];
    
    if (sesionActiva) {
      // Buscar si la entrada de la sesión activa ya está en la lista de fichajes
      const entradaExistente = fichajes.find(f => f.id === sesionActiva.id);
      
      if (entradaExistente) {
        // Crear un fichaje virtual de salida con la hora actual
        const salidaVirtual = {
          id: 'salida-virtual',
          tipo: 'salida',
          fecha: new Date().toISOString(),
          empleado: sesionActiva.empleado,
          virtual: true // Marcar como virtual para identificarlo
        };
        
        // Añadir al principio (normalmente se añaden los más recientes primero)
        fichajesConSesionActual = [salidaVirtual, ...fichajesConSesionActual];
      }
    }
    
    return calcularEstadisticas(fichajesConSesionActual, fechaInicio, fechaFin);
  },
  


// Enhanced getEstadisticas function that uses timer-based time instead of timestamp difference

getEstadisticas: (fechaInicio, fechaFin, sesionActiva = null) => {
  let fichajes = fichajeService.getFichajesPorFecha(fechaInicio, fechaFin);
  
  // Organizar fichajes por día
  const fichajesPorDia = {};
  fichajes.forEach(fichaje => {
    const fecha = new Date(fichaje.fecha).toLocaleDateString();
    if (!fichajesPorDia[fecha]) {
      fichajesPorDia[fecha] = [];
    }
    fichajesPorDia[fecha].push(fichaje);
  });
  
  // Si hay una sesión activa, añadir un fichaje virtual de salida
  if (sesionActiva) {
    // Verificar si la entrada de la sesión está dentro del período
    const entradaSesion = fichajes.find(f => f.id === sesionActiva.id);
    
    if (entradaSesion) {
      // Usar el tiempo actual del temporizador
      const tiempoActual = fichajeService.calcularTiempoSesionActiva();
      
      // Formatear el tiempo para mostrar
      const horas = Math.floor(tiempoActual / 3600);
      const minutos = Math.floor((tiempoActual % 3600) / 60);
      const segundos = Math.floor(tiempoActual % 60);
      const tiempoFormateado = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
      
      // Crear un fichaje virtual de salida con el tiempo del temporizador
      const salidaVirtual = {
        id: 'salida-virtual',
        tipo: 'salida',
        fecha: new Date().toISOString(),
        empleado: sesionActiva.empleado,
        virtual: true,
        tiempoTrabajado: tiempoActual,           // Tiempo en segundos 
        tiempoFormateado: tiempoFormateado,      // Formato hh:mm:ss
        entradaId: sesionActiva.id               // ID del fichaje de entrada
      };
      
      // Añadir a la lista de fichajes
      fichajes = [salidaVirtual, ...fichajes];
      
      // Añadir al día correspondiente
      const fechaVirtual = new Date().toLocaleDateString();
      if (!fichajesPorDia[fechaVirtual]) {
        fichajesPorDia[fechaVirtual] = [];
      }
      fichajesPorDia[fechaVirtual].push(salidaVirtual);
      
      console.log("Fichaje virtual añadido con tiempo trabajado:", tiempoFormateado);
    }
  }
  
  // Inicializar estadísticas
  const estadisticas = {
    dias: 0,
    horasTotales: 0,
    minutosTotales: 0,
    detallesPorDia: [],
    sesionActivaIncluida: !!sesionActiva
  };
  
  // Para cada día, calcular las horas trabajadas
  Object.keys(fichajesPorDia).forEach(fecha => {
    const fichajesDia = fichajesPorDia[fecha];
    
    // Ordenar fichajes por fecha
    fichajesDia.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    // Buscar pares de entrada/salida
    const entradasSalidas = [];
    
    // Primer enfoque: buscar salidas con tiempoTrabajado (prioridad máxima)
    const salidasConTiempo = fichajesDia.filter(f => 
      f.tipo === 'salida' && f.tiempoTrabajado !== undefined && f.entradaId !== undefined
    );
    
    // Para cada salida con tiempo, buscar su entrada correspondiente
    salidasConTiempo.forEach(salida => {
      const entrada = fichajesDia.find(f => f.id === salida.entradaId);
      if (entrada) {
        // Usar directamente el tiempo trabajado registrado
        const segundosTrabajados = salida.tiempoTrabajado;
        const horasTrabajadas = segundosTrabajados / 3600; // Convertir segundos a horas
        
        // Calcular horas y minutos enteros
        const horas = Math.floor(horasTrabajadas);
        const minutos = Math.round((horasTrabajadas - horas) * 60);
        
        // Añadir a las estadísticas
        estadisticas.dias++;
        estadisticas.horasTotales += horas;
        estadisticas.minutosTotales += minutos;
        
        // Añadir detalles por día
        estadisticas.detallesPorDia.push({
          fecha,
          fechaObj: new Date(entrada.fecha),
          entrada: entrada.fecha,
          salida: salida.fecha,
          incluyeSesionActiva: !!salida.virtual,
          horas,
          minutos,
          tiempoFormateado: salida.tiempoFormateado || `${horas}h ${minutos}m`,
          horasTrabajadas
        });
        
        // Marcar estos fichajes como procesados
        entradasSalidas.push({ entrada, salida });
      }
    });
  });
  
  // Normalizar minutos (60 minutos = 1 hora)
  if (estadisticas.minutosTotales >= 60) {
    const horasExtra = Math.floor(estadisticas.minutosTotales / 60);
    estadisticas.horasTotales += horasExtra;
    estadisticas.minutosTotales %= 60;
  }
  
  return estadisticas;
}
};

export default fichajeService;