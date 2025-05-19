import React, { createContext, useState, useEffect, useRef } from 'react';
import fichajeService from '../services/fichajeService';
import * as serviceWorkerRegistration from '../serviceWorkerRegistration';


export const FichajeContext = createContext();

export const FichajeProvider = ({ children }) => {
  const [fichajes, setFichajes] = useState([]);
  const [nombreEmpleado, setNombreEmpleado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sesionActiva, setSesionActiva] = useState(null);
  const [tiempoSesion, setTiempoSesion] = useState(0);
  const timerInterval = useRef(null);

  const iniciarIntervaloTemporizador = () => {
  console.log("Iniciando intervalo del temporizador...");
  
  if (timerInterval.current) {
    console.log("Limpiando intervalo existente");
    clearInterval(timerInterval.current);
    timerInterval.current = null;
  }

  const tiempoInicial = fichajeService.calcularTiempoSesionActiva();
  console.log(`Iniciando temporizador con tiempo inicial: ${tiempoInicial}s`);
  
  setTiempoSesion(tiempoInicial);
  
  timerInterval.current = setInterval(() => {

    const tiempoCalculado = fichajeService.calcularTiempoSesionActiva();
    
    setTiempoSesion(prevTiempo => {
      if (Math.abs(tiempoCalculado - prevTiempo) > 0.1) {
        console.log(`Actualización de temporizador: ${prevTiempo}s -> ${tiempoCalculado}s`);
        return tiempoCalculado;
      }
      return prevTiempo;
    });
  }, 1000);
  
  console.log("Intervalo establecido con ID:", timerInterval.current);
};
  
  const detenerIntervaloTemporizador = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };
  

  useEffect(() => {
    const cargarDatos = () => {
      try {
        console.log("Cargando datos iniciales...");

        const storedFichajes = fichajeService.getFichajes();
        const storedNombre = fichajeService.getNombreEmpleado();
        
        setFichajes(storedFichajes);
        setNombreEmpleado(storedNombre);
        

        const sesionGuardada = fichajeService.getSesionActiva();
        console.log("Sesión guardada encontrada:", sesionGuardada);
        
        if (sesionGuardada) {

          if (sesionGuardada.id && sesionGuardada.fechaInicio) {
            const entradaExiste = storedFichajes.some(
              (fichaje) => fichaje.id === sesionGuardada.id && fichaje.tipo === 'entrada'
            );
            
            if (entradaExiste) {
              console.log("Sesión válida encontrada, activando...");
              let sesionActualizada = {...sesionGuardada};
              
              if (!sesionActualizada.ultimaActualizacion) {
                sesionActualizada.ultimaActualizacion = sesionActualizada.fechaInicio;
                fichajeService.setSesionActiva(sesionActualizada);
              }
              

              setSesionActiva(sesionActualizada);
              
              const tiempoCalculado = fichajeService.calcularTiempoSesionActiva();
              console.log("Tiempo calculado:", tiempoCalculado);
              setTiempoSesion(tiempoCalculado);
              
              try {
                serviceWorkerRegistration.startTimerInSW(
                  sesionActualizada.id,
                  sesionActualizada.fechaInicio,
                  sesionActualizada.tiempoAcumulado || 0,
                  sesionActualizada.pausada || false
                );
              } catch (swError) {
                console.warn('Error al iniciar el temporizador en el Service Worker:', swError);
              }
              
              if (!sesionActualizada.pausada) {
                iniciarIntervaloTemporizador();
              }
            } else {
              console.warn('Sesión inválida detectada (no hay fichaje correspondiente). Limpiando...');
              fichajeService.clearSesionActiva();
            }
          } else {
            console.warn('Sesión inválida detectada (faltan datos). Limpiando...');
            fichajeService.clearSesionActiva();
          }
        } else {
          console.log("No hay sesión activa guardada");
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos. Intente recargar la página.');
        setLoading(false);
      }
    };
    
    cargarDatos();

    return () => {
      detenerIntervaloTemporizador();
      try {
        serviceWorkerRegistration.stopTimerInSW();
      } catch (error) {
        console.warn('Error al detener el temporizador en el Service Worker:', error);
      }
    };
  }, []);
  
  useEffect(() => {
    if (sesionActiva) {
      console.log("Estado de pausa cambiado:", sesionActiva.pausada);
      if (sesionActiva.pausada) {
        detenerIntervaloTemporizador();
      } else {
        iniciarIntervaloTemporizador();
      }
    }
  }, [sesionActiva?.pausada]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log("Visibilidad cambiada:", document.visibilityState);
      
      if (document.visibilityState === 'visible') {

        if (sesionActiva) {
          console.log("Página visible con sesión activa, recalculando tiempo...");
          
          const tiempoCalculado = fichajeService.calcularTiempoSesionActiva();
          console.log("Tiempo recalculado:", tiempoCalculado);
          setTiempoSesion(tiempoCalculado);
          
          if (!sesionActiva.pausada) {
            iniciarIntervaloTemporizador();
          }
        }
      } else if (document.visibilityState === 'hidden') {

        console.log("Página oculta, deteniendo intervalo de UI");
        detenerIntervaloTemporizador();
      }
    };
    

    document.addEventListener('visibilitychange', handleVisibilityChange);
    

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sesionActiva]);
  
  const guardarNombreEmpleado = (nombre) => {
    try {
      fichajeService.setNombreEmpleado(nombre);
      setNombreEmpleado(nombre);
      return true;
    } catch (err) {
      setError('Error al guardar el nombre del empleado');
      return false;
    }
  };

  const registrarEntrada = () => {
    try {
      console.log("Registrando entrada...");
      if (sesionActiva) {
        setError('Ya tienes una sesión activa. Finaliza la sesión actual antes de iniciar una nueva.');
        return { 
          success: false, 
          message: 'Ya tienes una sesión activa' 
        };
      }
      
      const result = fichajeService.registrarFichaje(
        'entrada', 
        nombreEmpleado
      );
      
      if (result.success) {
        console.log("Entrada registrada correctamente:", result.fichaje);
        
        const nuevaSesion = {
          id: result.fichaje.id,
          fechaInicio: result.fichaje.fecha,
          empleado: nombreEmpleado,
          tiempoAcumulado: 0,
          pausada: false,
          ultimaActualizacion: new Date().toISOString()
        };

        setSesionActiva(nuevaSesion);
        setTiempoSesion(0);
        setFichajes(prevFichajes => [result.fichaje, ...prevFichajes]);
        
        fichajeService.setSesionActiva(nuevaSesion);
        
        try {
          serviceWorkerRegistration.startTimerInSW(
            nuevaSesion.id,
            nuevaSesion.fechaInicio,
            nuevaSesion.tiempoAcumulado,
            nuevaSesion.pausada
          );
        } catch (swError) {
          console.warn('Error al iniciar el temporizador en el Service Worker:', swError);
        }
        
        iniciarIntervaloTemporizador();
      } else {
        setError(result.message || 'Error al registrar entrada');
      }
      
      return result;
    } catch (err) {
      console.error("Error en registrarEntrada:", err);
      const message = 'Error al registrar entrada';
      setError(message);
      return { success: false, message };
    }
  };
  


// Registrar salida
const registrarSalida = () => {
  try {
    console.log("Registrando salida...");
    if (!sesionActiva) {
      setError('No hay ninguna sesión activa para registrar la salida.');
      return { 
        success: false, 
        message: 'No hay sesión activa' 
      };
    }

    const tiempoExacto = tiempoSesion;
    console.log("Tiempo exacto del temporizador al registrar salida:", tiempoExacto);
    
    detenerIntervaloTemporizador();
    
    try {
      serviceWorkerRegistration.stopTimerInSW();
    } catch (swError) {
      console.warn('Error al comunicarse con el Service Worker:', swError);
    }
    
    const horas = Math.floor(tiempoExacto / 3600);
    const minutos = Math.floor((tiempoExacto % 3600) / 60);
    const segundos = Math.floor(tiempoExacto % 60);
    
    const tiempoFormateado = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    
    const result = fichajeService.registrarFichaje(
      'salida', 
      nombreEmpleado,
      {
        tiempoTrabajado: tiempoExacto, 
        tiempoFormateado: tiempoFormateado,  
        entradaId: sesionActiva.id          
      }
    );
    
    if (result.success) {
      console.log("Salida registrada correctamente con tiempo trabajado:", tiempoFormateado);
      
      setSesionActiva(null);
      setTiempoSesion(0);
      
      setFichajes(prevFichajes => [result.fichaje, ...prevFichajes]);
      
      fichajeService.clearSesionActiva();
      
      return result;
    } else {
      setError(result.message || 'Error al registrar salida');
      
      return result;
    }
  } catch (err) {
    console.error("Error en registrarSalida:", err);
    const message = 'Error al registrar salida';
    setError(message);
    return { success: false, message };
  }
};
  

// Pausar o reanudar la sesión con tracking preciso de tiempo acumulado
const togglePausaSesion = (pausar) => {
  try {
    console.log(`${pausar ? 'Pausando' : 'Reanudando'} sesión...`);
    
    if (!sesionActiva) {
      return {
        success: false,
        message: 'No hay sesión activa para pausar/reanudar'
      };
    }
    
    if (pausar) {
      console.log('Pausando: Guardando tiempo acumulado hasta ahora');
      
      const tiempoActual = fichajeService.calcularTiempoSesionActiva();
      console.log(`Tiempo acumulado al pausar: ${tiempoActual} segundos`);

      detenerIntervaloTemporizador();
      
      const sesionActualizada = {
        ...sesionActiva,
        pausada: true,
        tiempoAcumulado: tiempoActual,
        ultimaActualizacion: new Date().toISOString()
      };
      
      setSesionActiva(sesionActualizada);
      
      fichajeService.setSesionActiva(sesionActualizada);
      
      try {
        serviceWorkerRegistration.togglePauseTimerInSW(true);
      } catch (error) {
        console.warn('Error al comunicarse con el Service Worker:', error);
      }
      
      return { 
        success: true, 
        sesion: sesionActualizada 
      };
    } 
    else {
      console.log('Reanudando: Manteniendo tiempo acumulado y comenzando a contar desde ahí');
      
      const tiempoAcumulado = sesionActiva.tiempoAcumulado || 0;
      console.log(`Reanudando con tiempo acumulado: ${tiempoAcumulado} segundos`);
      
      const sesionActualizada = {
        ...sesionActiva,
        pausada: false,
        ultimaActualizacion: new Date().toISOString()
      };

      setSesionActiva(sesionActualizada);
      
      iniciarIntervaloTemporizador();

      fichajeService.setSesionActiva(sesionActualizada);

      try {
        serviceWorkerRegistration.togglePauseTimerInSW(false);
      } catch (error) {
        console.warn('Error al comunicarse con el Service Worker:', error);
      }
      
      return { 
        success: true, 
        sesion: sesionActualizada 
      };
    }
  } catch (err) {
    console.error("Error en togglePausaSesion:", err);
    const message = 'Error al cambiar estado de pausa';
    setError(message);
    return { success: false, message };
  }
};

  const cancelarSesionActiva = () => {
    try {
      console.log("Cancelando sesión activa...");
      
      if (!sesionActiva) {
        return { success: false, message: 'No hay una sesión activa para cancelar' };
      }
      
      const entradaId = sesionActiva.id;
      
      detenerIntervaloTemporizador();
      

      try {
        serviceWorkerRegistration.stopTimerInSW();
      } catch (swError) {
        console.warn('Error al comunicarse con el Service Worker:', swError);
      }
      
      setSesionActiva(null);
      setTiempoSesion(0);
      
      const result = fichajeService.eliminarFichaje(entradaId);
      
      if (result.success) {
        console.log("Sesión cancelada correctamente");
        
        setFichajes(result.fichajes);
        
        fichajeService.clearSesionActiva();
        return { success: true };
      } else {
        setError(result.message || 'Error al cancelar la sesión');
        return result;
      }
    } catch (err) {
      console.error("Error en cancelarSesionActiva:", err);
      const message = 'Error al cancelar la sesión';
      setError(message);
      return { success: false, message };
    }
  };
  
  const editarFichaje = (fichajeId, nuevaFecha) => {
    try {
      console.log(`Editando fichaje ${fichajeId} a fecha ${nuevaFecha}`);

      if (sesionActiva && sesionActiva.id === fichajeId) {
        const originalStartTime = new Date(sesionActiva.fechaInicio);
         const timeDiffSeconds = (originalStartTime - nuevaFecha) / 1000;
         const currentTime = tiempoSesion || 0;
        const newAccumulatedTime = Math.max(0, currentTime + timeDiffSeconds);


        const nuevaSesion = {
          ...sesionActiva,
          fechaInicio: nuevaFecha.toISOString(),
          tiempoAcumulado: 0,
          ultimaActualizacion: new Date().toISOString()
        };
        
        setSesionActiva(nuevaSesion);
        setTiempoSesion(newAccumulatedTime);
        
        fichajeService.setSesionActiva(nuevaSesion);
        
        try {
          serviceWorkerRegistration.startTimerInSW(
            nuevaSesion.id,
            nuevaSesion.fechaInicio,
            nuevaSesion.tiempoAcumulado,
            nuevaSesion.pausada
          );
        } catch (swError) {
          console.warn('Error al comunicarse con el Service Worker:', swError);
        }
      }
      
      const result = fichajeService.editarFichaje(fichajeId, nuevaFecha);
      
      if (result.success) {
        console.log("Fichaje editado correctamente");
        setFichajes(result.fichajes);
      } else {
        setError(result.message || 'Error al editar fichaje');
      }
      
      return result;
    } catch (err) {
      console.error("Error en editarFichaje:", err);
      const message = 'Error al editar fichaje';
      setError(message);
      return { success: false, message };
    }
  };
  

  const eliminarFichaje = (fichajeId) => {
    try {
      console.log(`Eliminando fichaje ${fichajeId}`);
      
      if (sesionActiva && sesionActiva.id === fichajeId) {
        return cancelarSesionActiva();
      }
      
      const result = fichajeService.eliminarFichaje(fichajeId);
      
      if (result.success) {
        console.log("Fichaje eliminado correctamente");
        setFichajes(result.fichajes);
      } else {
        setError(result.message || 'Error al eliminar fichaje');
      }
      
      return result;
    } catch (err) {
      console.error("Error en eliminarFichaje:", err);
      const message = 'Error al eliminar fichaje';
      setError(message);
      return { success: false, message };
    }
  };
  

  const getFichajesPorPeriodo = (fechaInicio, fechaFin) => {
    try {
      return fichajeService.getFichajesPorFecha(fechaInicio, fechaFin);
    } catch (err) {
      console.error("Error en getFichajesPorPeriodo:", err);
      setError('Error al obtener fichajes por período');
      return [];
    }
  };
  

  const getEstadisticas = (fechaInicio, fechaFin) => {
    try {
      return fichajeService.getEstadisticas(fechaInicio, fechaFin, sesionActiva);
    } catch (err) {
      console.error("Error en getEstadisticas:", err);
      setError('Error al obtener estadísticas');
      return null;
    }
  };
  

  const getEstadisticasDetalladas = (fechaInicio, fechaFin) => {
    try {
      return fichajeService.getEstadisticasDetalladas(fechaInicio, fechaFin, sesionActiva);
    } catch (err) {
      console.error("Error en getEstadisticasDetalladas:", err);
      setError('Error al obtener estadísticas detalladas');
      return null;
    }
  };
  
  const value = {
    fichajes,
    nombreEmpleado,
    setNombreEmpleado: guardarNombreEmpleado,
    loading,
    error,
    sesionActiva,
    tiempoSesion,
    registrarEntrada,
    registrarSalida,
    togglePausaSesion,
    editarFichaje,
    eliminarFichaje,
    cancelarSesionActiva,
    getFichajesPorPeriodo,
    getEstadisticas,
    getEstadisticasDetalladas
  };
  
  return <FichajeContext.Provider value={value}>{children}</FichajeContext.Provider>;
};