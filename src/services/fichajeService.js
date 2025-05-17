import storageService from './storageService';

const FICHAJES_KEY = 'fichajes';
const EMPLEADO_KEY = 'nombreEmpleado';

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

  getEstadisticas: (fechaInicio, fechaFin) => {
    const fichajes = fichajeService.getFichajesPorFecha(fechaInicio, fechaFin);

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
      detallesPorDia: []
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
        estadisticas.horasTotales += horasTrabajadas;
        estadisticas.detallesPorDia.push({
          fecha,
          entrada: entrada.fecha,
          salida: salida.fecha,
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