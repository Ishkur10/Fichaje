import storageService from './storageService';

// Claves para localStorage
const FICHAJES_KEY = 'fichajes';
const EMPLEADO_KEY = 'nombreEmpleado';

const fichajeService = {
  // Obtener todos los fichajes
  getFichajes: () => {
    return storageService.getItem(FICHAJES_KEY) || [];
  },
  
  // Obtener nombre del empleado
  getNombreEmpleado: () => {
    return storageService.getItem(EMPLEADO_KEY) || '';
  },
  
  // Guardar nombre del empleado
  setNombreEmpleado: (nombre) => {
    return storageService.setItem(EMPLEADO_KEY, nombre);
  },
  
  // Registrar un nuevo fichaje
  registrarFichaje: (tipo, nombre) => {
    const fichajes = fichajeService.getFichajes();
    
    const nuevoFichaje = {
      id: Date.now(),
      tipo, // 'entrada' o 'salida'
      fecha: new Date().toISOString(),
      empleado: nombre || 'Sin nombre'
    };
    
    // Añadir al principio del array para tener los más recientes primero
    const nuevosFichajes = [nuevoFichaje, ...fichajes];
    storageService.setItem(FICHAJES_KEY, nuevosFichajes);
    
    return { success: true, fichaje: nuevoFichaje, fichajes: nuevosFichajes };
  },
  
  // Eliminar un fichaje
  eliminarFichaje: (fichajeId) => {
    const fichajes = fichajeService.getFichajes();
    const nuevosFichajes = fichajes.filter(f => f.id !== fichajeId);
    
    if (fichajes.length === nuevosFichajes.length) {
      return { success: false, message: 'Fichaje no encontrado' };
    }
    
    storageService.setItem(FICHAJES_KEY, nuevosFichajes);
    return { success: true, fichajes: nuevosFichajes };
  },
  
  // Obtener fichajes filtrados por fecha
  getFichajesPorFecha: (fechaInicio, fechaFin) => {
    const fichajes = fichajeService.getFichajes();
    
    return fichajes.filter(fichaje => {
      const fechaFichaje = new Date(fichaje.fecha);
      return fechaFichaje >= fechaInicio && fechaFichaje <= fechaFin;
    });
  },
  
  // Obtener estadísticas de fichajes (horas trabajadas, etc.)
  getEstadisticas: (fechaInicio, fechaFin) => {
    const fichajes = fichajeService.getFichajesPorFecha(fechaInicio, fechaFin);
    
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
      detallesPorDia: []
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
        
        estadisticas.dias++;
        estadisticas.horasTotales += horasTrabajadas;
        estadisticas.detallesPorDia.push({
          fecha,
          entrada: entrada.fecha,
          salida: salida.fecha,
          horasTrabajadas
        });
      }
    });
    
    return estadisticas;
  }
};

export default fichajeService;