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
    const fichajeToEdit = nuevosFichajes[fichajeIndex];

    nuevosFichajes[fichajeIndex] = {
      ...fichajeToEdit,
      fecha: nuevaFecha.toISOString()
    };


    if (fichajeToEdit.tipo === 'entrada') {
    const entradaId = fichajeToEdit.id;
    
    nuevosFichajes.forEach((fichaje, index) => {
      if (fichaje.tipo === 'salida' && fichaje.entradaId === entradaId) {
        const entradaFecha = new Date(nuevaFecha);
        const salidaFecha = new Date(fichaje.fecha);
        
        if (salidaFecha > entradaFecha) {
          let newTiempoTrabajado;
          
          if (fichaje.tiempoTrabajado !== undefined) {
            const originalEntrada = new Date(fichajeToEdit.fecha);
            const originalTotalTime = (salidaFecha - originalEntrada) / 1000;
            const originalWorkTime = fichaje.tiempoTrabajado;
            
            const workRatio = originalWorkTime / originalTotalTime;
            
            const newTotalTime = (salidaFecha - entradaFecha) / 1000;
            newTiempoTrabajado = Math.max(0, newTotalTime * workRatio);
          } else {
            newTiempoTrabajado = (salidaFecha - entradaFecha) / 1000;
          }
          
          const horas = Math.floor(newTiempoTrabajado / 3600);
          const minutos = Math.floor((newTiempoTrabajado % 3600) / 60);
          const tiempoFormateado = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
          
          nuevosFichajes[index] = {
            ...fichaje,
            tiempoTrabajado: newTiempoTrabajado,
            tiempoFormateado
          };
        }
      }
    });
  } else if (fichajeToEdit.tipo === 'salida' && fichajeToEdit.entradaId) {
    const entradaIndex = nuevosFichajes.findIndex(f => f.id === fichajeToEdit.entradaId);
    
    if (entradaIndex !== -1) {
      const entradaFecha = new Date(nuevosFichajes[entradaIndex].fecha);
      const salidaFecha = new Date(nuevaFecha);
      
      if (salidaFecha > entradaFecha) {

        let newTiempoTrabajado;
        
        if (fichajeToEdit.tiempoTrabajado !== undefined) {
          const originalSalida = new Date(fichajeToEdit.fecha);
          const originalTotalTime = (originalSalida - entradaFecha) / 1000;
          const originalWorkTime = fichajeToEdit.tiempoTrabajado;
          
          const workRatio = originalWorkTime / originalTotalTime;
          
          const newTotalTime = (salidaFecha - entradaFecha) / 1000;
          newTiempoTrabajado = Math.max(0, newTotalTime * workRatio);
        } else {
          newTiempoTrabajado = (salidaFecha - entradaFecha) / 1000;
        }
        
        const horas = Math.floor(newTiempoTrabajado / 3600);
        const minutos = Math.floor((newTiempoTrabajado % 3600) / 60);
        const tiempoFormateado = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        
        nuevosFichajes[fichajeIndex] = {
          ...nuevosFichajes[fichajeIndex],
          tiempoTrabajado: newTiempoTrabajado,
          tiempoFormateado
        };
      }
    }
  }

    // if (nuevosFichajes[fichajeIndex].tipo === 'entrada') {
    //   const entradaId = nuevosFichajes[fichajeIndex].id;

    //   nuevosFichajes.forEach((fichaje, index) => {
    //     if (fichaje.tipo === 'salida' && fichaje.entradaId === entradaId) {
    //       const entradaFecha = new Date(nuevaFecha);
    //       const salidaFecha = new Date(fichaje.fecha);

    //       if (salidaFecha > entradaFecha) {
    //         const segundosTrabajados = (salidaFecha - entradaFecha)/ 1000;
    //         const horas = Math.floor(segundosTrabajados / 3600);
    //         const minutos = Math.floor((segundosTrabajados % 3600) / 60);
    //         nuevosFichajes[index] = {
    //         ...fichaje,
    //         tiempoTrabajado: segundosTrabajados,
    //         tiempoFormateado: `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
    //       };
    //       }
    //     }
    //   })
    // }

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

  if (sesion.pausada) {  console.log(`Sesión pausada, tiempo acumulado: ${tiempoAcumulado}s`);
    return tiempoAcumulado;
  }

  const ultimaActualizacion = sesion.ultimaActualizacion 
    ? new Date(sesion.ultimaActualizacion) 
    : new Date(sesion.fechaInicio);
  
  const ahora = new Date();
  const segundosAdicionales = Math.max(0, (ahora - ultimaActualizacion) / 1000);
  const tiempoTotal = tiempoAcumulado + segundosAdicionales;

  fichajeService.setSesionActiva({
    ...sesion,
    ultimaActualizacion: ahora.toISOString(),
    tiempoAcumulado: tiempoTotal 
  });
  
  return tiempoTotal;
    
},

  registrarFichaje: (tipo, nombre, options = {}) => {
  const fichajes = fichajeService.getFichajes();  
  const nuevoFichaje = {
    id: Date.now(),
    tipo,
    fecha: new Date().toISOString(),
    empleado: nombre || 'Sin nombre'
  };

  if (tipo === 'salida' && options.entradaId ){
    nuevoFichaje.entradaId = options.entradaId;
    nuevoFichaje.tiempoTrabajado = options.tiempoTrabajado || 0;
    nuevoFichaje.tiempoFormateado = options.tiempoFormateado || '00:00';
    nuevoFichaje.pausada = options.pausada || false;
  }

  const nuevosFichajes = [nuevoFichaje, ...fichajes];
  

  storageService.setItem(FICHAJES_KEY, nuevosFichajes);
  

  console.log(`Total fichajes después de registrar ${tipo}:`, nuevosFichajes.length);
  console.log('Fichaje más reciente:', nuevosFichajes[0]);

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
    
  
    let fichajesConSesionActual = [...fichajes];
    
    if (sesionActiva) {
      const entradaExistente = fichajes.find(f => f.id === sesionActiva.id);
      
      if (entradaExistente) {
        const salidaVirtual = {
          id: 'salida-virtual',
          tipo: 'salida',
          fecha: new Date().toISOString(),
          empleado: sesionActiva.empleado,
          virtual: true 
        };
        
        fichajesConSesionActual = [salidaVirtual, ...fichajesConSesionActual];
      }
    }
    
    return calcularEstadisticas(fichajesConSesionActual, fechaInicio, fechaFin);
  },
  

  getEstadisticas: (fechaInicio, fechaFin, sesionActiva = null) => {
    let fichajes = fichajeService.getFichajesPorFecha(fechaInicio, fechaFin);
    

    if (sesionActiva) {

      const entradaSesion = fichajes.find(f => f.id === sesionActiva.id);
      
      if (entradaSesion) {

        const salidaVirtual = {
          id: 'salida-virtual',
          tipo: 'salida',
          fecha: new Date().toISOString(),
          empleado: sesionActiva.empleado,
          virtual: true
        };
        

        fichajes = [salidaVirtual, ...fichajes];
      }
    }
    

    const fichajesPorDia = {};
    fichajes.forEach(fichaje => {
      const fecha = new Date(fichaje.fecha).toLocaleDateString();
      if (!fichajesPorDia[fecha]) {
        fichajesPorDia[fecha] = [];
      }
      fichajesPorDia[fecha].push(fichaje);
    });
    

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
      

      if (entrada && salida && new Date(salida.fecha) > new Date(entrada.fecha)) {
        const horasTrabajadas = (new Date(salida.fecha) - new Date(entrada.fecha)) / (1000 * 60 * 60);
        

        const horas = Math.floor(horasTrabajadas);
        const minutos = Math.round((horasTrabajadas - horas) * 60);
        
        estadisticas.dias++;
        estadisticas.horasTotales += horas;
        estadisticas.minutosTotales += minutos;
        
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
    
    if (estadisticas.minutosTotales >= 60) {
      const horasExtra = Math.floor(estadisticas.minutosTotales / 60);
      estadisticas.horasTotales += horasExtra;
      estadisticas.minutosTotales %= 60;
    }
    
    return estadisticas;
  }
};

export default fichajeService;