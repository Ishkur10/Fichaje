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
      // Asegurarnos de que la sesión tiene un tiempoAcumulado (para pausas)
      if (sesion.tiempoAcumulado === undefined) {
        sesion.tiempoAcumulado = 0;
      }
      
      // Asegurarnos de que tiene una marca de tiempo de la última actualización
      if (!sesion.ultimaActualizacion) {
        sesion.ultimaActualizacion = new Date().toISOString();
      }
      
      // Asegurarnos de que tiene un estado de pausa
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
  
  // Limpiar sesión activa
  clearSesionActiva: () => {
    return storageService.removeItem(SESION_ACTIVA_KEY);
  },
  
  // Pausar o reanudar una sesión activa
  togglePausaSesion: (pausar) => {
    const sesion = fichajeService.getSesionActiva();
    
    if (!sesion) {
      return { success: false, message: 'No hay sesión activa' };
    }
    
    if (pausar === sesion.pausada) {
      // Si ya está en el estado deseado, no hacemos nada
      return { success: true, sesion };
    }
    
    const ahora = new Date();
    let nuevaSesion = { ...sesion };
    
    if (pausar) {
      // Si estamos pausando, calculamos el tiempo acumulado hasta ahora
      const ultimaActualizacion = new Date(sesion.ultimaActualizacion);
      const segundosDesdeUltimaActualizacion = (ahora - ultimaActualizacion) / 1000;
      
      // Sumamos al tiempo acumulado
      nuevaSesion.tiempoAcumulado = (sesion.tiempoAcumulado || 0) + segundosDesdeUltimaActualizacion;
    }
    
    // Actualizamos el estado de pausa y la marca de tiempo
    nuevaSesion.pausada = pausar;
    nuevaSesion.ultimaActualizacion = ahora.toISOString();
    
    fichajeService.setSesionActiva(nuevaSesion);
    
    return { success: true, sesion: nuevaSesion };
  },
  
  // Calcular tiempo total de sesión activa
  calcularTiempoSesionActiva: () => {
  const sesion = fichajeService.getSesionActiva();
  
  if (!sesion) {
    return 0;
  }
  
  // Tiempo base acumulado (útil para pausas)
  let tiempoTotal = sesion.tiempoAcumulado || 0;
  
  // Si la sesión no está pausada, añadimos el tiempo desde la última actualización
  if (!sesion.pausada) {
    const fechaInicio = new Date(sesion.ultimaActualizacion);
    const ahora = new Date();
    const segundosAdicionales = Math.max(0, (ahora - fechaInicio) / 1000);
    tiempoTotal += segundosAdicionales;
    
    // Actualizar la marca de tiempo para cálculos futuros
    // sin afectar al tiempo acumulado ya calculado
    const sesionActualizada = {
      ...sesion,
      ultimaActualizacion: ahora.toISOString()
    };
    fichajeService.setSesionActiva(sesionActualizada);
  }
  
  return tiempoTotal;
},

  registrarFichaje: (tipo, nombre) => {
    const fichajes = fichajeService.getFichajes();

    const nuevoFichaje = {
      id: Date.now(),
      tipo,
      fecha: new Date().toISOString(),
      empleado: nombre || 'Sin nombre'
    };

    const nuevosFichajes = [nuevoFichaje, ...fichajes];
    storageService.setItem(FICHAJES_KEY, nuevosFichajes);

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
  
  // Obtener estadísticas de fichajes (horas trabajadas, etc.)
  getEstadisticas: (fechaInicio, fechaFin, sesionActiva = null) => {
    let fichajes = fichajeService.getFichajesPorFecha(fechaInicio, fechaFin);
    
    // Si hay una sesión activa, añadir un fichaje virtual de salida
    if (sesionActiva) {
      // Verificar si la entrada de la sesión está dentro del período
      const entradaSesion = fichajes.find(f => f.id === sesionActiva.id);
      
      if (entradaSesion) {
        // Crear un fichaje virtual de salida con la hora actual
        const salidaVirtual = {
          id: 'salida-virtual',
          tipo: 'salida',
          fecha: new Date().toISOString(),
          empleado: sesionActiva.empleado,
          virtual: true
        };
        
        // Añadir a la lista de fichajes
        fichajes = [salidaVirtual, ...fichajes];
      }
    }
    
    // Organizar fichajes por día
    const fichajesPorDia = {};
    fichajes.forEach(fichaje => {
      const fecha = new Date(fichaje.fecha).toLocaleDateString();
      if (!fichajesPorDia[fecha]) {
        fichajesPorDia[fecha] = [];
      }
      fichajesPorDia[fecha].push(fichaje);
    });
    
    // Calcular horas trabajadas por día
    const estadisticas = {
      dias: 0,
      horasTotales: 0,
      minutosTotales: 0,
      detallesPorDia: [],
      sesionActivaIncluida: !!sesionActiva
    };
    
    Object.keys(fichajesPorDia).forEach(fecha => {
      const fichajesDia = fichajesPorDia[fecha];
      fichajesDia.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      
      // Buscar primera entrada y última salida
      let entrada = null;
      let salida = null;
      
      for (const fichaje of fichajesDia) {
        if (fichaje.tipo === 'entrada' && (!entrada || new Date(fichaje.fecha) < new Date(entrada.fecha))) {
          entrada = fichaje;
        }
        if (fichaje.tipo === 'salida' && (!salida || new Date(fichaje.fecha) > new Date(salida.fecha))) {
          salida = fichaje;
        }
      }
      
      // Calcular horas si hay entrada y salida
      if (entrada && salida && new Date(salida.fecha) > new Date(entrada.fecha)) {
        const horasTrabajadas = (new Date(salida.fecha) - new Date(entrada.fecha)) / (1000 * 60 * 60);
        
        // Calcular horas y minutos
        const horas = Math.floor(horasTrabajadas);
        const minutos = Math.round((horasTrabajadas - horas) * 60);
        
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
          horasTrabajadas
        });
      }
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