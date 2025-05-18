import React, { createContext, useState, useEffect, useRef } from 'react';
import fichajeService from '../services/fichajeService';
import * as serviceWorkerRegistration from '../serviceWorkerRegistration';

// Crear contexto
export const FichajeContext = createContext();

export const FichajeProvider = ({ children }) => {
  const [fichajes, setFichajes] = useState([]);
  const [nombreEmpleado, setNombreEmpleado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sesionActiva, setSesionActiva] = useState(null);
  const [tiempoSesion, setTiempoSesion] = useState(0);
  const timerInterval = useRef(null);
  
  // Función para iniciar el intervalo del temporizador
  const iniciarIntervaloTemporizador = () => {
    // Limpiar cualquier intervalo existente primero
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    
    // Configurar un nuevo intervalo
    timerInterval.current = setInterval(() => {
      const tiempoCalculado = fichajeService.calcularTiempoSesionActiva();
      setTiempoSesion(tiempoCalculado);
    }, 1000);
  };
  
  // Detener el intervalo del temporizador
  const detenerIntervaloTemporizador = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };
  
  // Cargar fichajes al iniciar
  useEffect(() => {
    const cargarDatos = () => {
      try {
        // Cargar fichajes y nombre de empleado
        const storedFichajes = fichajeService.getFichajes();
        const storedNombre = fichajeService.getNombreEmpleado();
        
        setFichajes(storedFichajes);
        setNombreEmpleado(storedNombre);
        
        // CORRECCIÓN: Verificar si hay una sesión activa VÁLIDA
        const sesionGuardada = fichajeService.getSesionActiva();
        
        if (sesionGuardada) {
          // Verificar si la sesión es válida (tiene ID, fecha de inicio, etc.)
          if (sesionGuardada.id && sesionGuardada.fechaInicio) {
            // Verificar si existe un fichaje de entrada correspondiente
            const entradaExiste = storedFichajes.some(
              (fichaje) => fichaje.id === sesionGuardada.id && fichaje.tipo === 'entrada'
            );
            
            if (entradaExiste) {
              // La sesión es válida, la activamos
              setSesionActiva(sesionGuardada);
              
              // Calcular el tiempo transcurrido correctamente
              const tiempoCalculado = fichajeService.calcularTiempoSesionActiva();
              setTiempoSesion(tiempoCalculado);
              
              // Iniciar el temporizador en el Service Worker
              serviceWorkerRegistration.startTimerInSW(
                sesionGuardada.id,
                sesionGuardada.fechaInicio,
                sesionGuardada.tiempoAcumulado || 0,
                sesionGuardada.pausada || false
              );
              
              // Solo iniciar el intervalo si la sesión no está pausada
              if (!sesionGuardada.pausada) {
                iniciarIntervaloTemporizador();
              }
            } else {
              // No hay fichaje de entrada correspondiente, limpiamos la sesión
              console.warn('Sesión inválida detectada (no hay fichaje correspondiente). Limpiando...');
              fichajeService.clearSesionActiva();
            }
          } else {
            // Sesión inválida, la limpiamos
            console.warn('Sesión inválida detectada. Limpiando...');
            fichajeService.clearSesionActiva();
          }
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
      // Limpiar el intervalo y detener el temporizador al desmontar
      detenerIntervaloTemporizador();
      serviceWorkerRegistration.stopTimerInSW();
    };
  }, []);
  
  // Efecto para manejar cambios en el estado de pausa de la sesión
  useEffect(() => {
    if (sesionActiva) {
      if (sesionActiva.pausada) {
        detenerIntervaloTemporizador();
      } else {
        iniciarIntervaloTemporizador();
      }
    }
  }, [sesionActiva?.pausada]);
  
  // Escuchar eventos de visibilidad de la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && sesionActiva) {
        // Cuando la página vuelve a ser visible y hay una sesión activa,
        // recalculamos el tiempo transcurrido
        const tiempoCalculado = fichajeService.calcularTiempoSesionActiva();
        setTiempoSesion(tiempoCalculado);
        
        // Reiniciar el intervalo si la sesión no está pausada
        if (!sesionActiva.pausada) {
          iniciarIntervaloTemporizador();
        }
      } else if (document.visibilityState === 'hidden') {
        // Cuando la página deja de ser visible, pausamos el intervalo de actualización UI
        // pero NO pausamos la sesión activa
        detenerIntervaloTemporizador();
      }
    };
    
    // Registrar el evento de cambio de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Limpiar el evento al desmontar
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sesionActiva]);
  
  // Guardar nombre de empleado
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
  
  // Registrar entrada
  const registrarEntrada = () => {
    try {
      // Verificar si ya hay una sesión activa
      if (sesionActiva) {
        setError('Ya tienes una sesión activa. Finaliza la sesión actual antes de iniciar una nueva.');
        return { 
          success: false, 
          message: 'Ya tienes una sesión activa' 
        };
      }
      
      // Registrar nueva entrada
      const result = fichajeService.registrarFichaje(
        'entrada', 
        nombreEmpleado
      );
      
      if (result.success) {
        // Guardar información de la sesión activa
        const nuevaSesion = {
          id: result.fichaje.id,
          fechaInicio: result.fichaje.fecha,
          empleado: nombreEmpleado,
          tiempoAcumulado: 0,
          pausada: false,
          ultimaActualizacion: new Date().toISOString()
        };
        
        // Actualizar estado
        setSesionActiva(nuevaSesion);
        setTiempoSesion(0);
        setFichajes(result.fichajes);
        
        // Guardar en localStorage
        fichajeService.setSesionActiva(nuevaSesion);
        
        // Iniciar el temporizador en el Service Worker
        serviceWorkerRegistration.startTimerInSW(
          nuevaSesion.id,
          nuevaSesion.fechaInicio,
          nuevaSesion.tiempoAcumulado,
          nuevaSesion.pausada
        );
        
        // Iniciar el intervalo del temporizador
        iniciarIntervaloTemporizador();
      } else {
        setError(result.message || 'Error al registrar entrada');
      }
      
      return result;
    } catch (err) {
      const message = 'Error al registrar entrada';
      setError(message);
      return { success: false, message };
    }
  };
  
 // Registrar salida
const registrarSalida = () => {
  try {
    // Verificar si hay una sesión activa
    if (!sesionActiva) {
      setError('No hay ninguna sesión activa para registrar la salida.');
      return { 
        success: false, 
        message: 'No hay sesión activa' 
      };
    }
    
  // Detener el intervalo de actualización y el temporizador del SW
    detenerIntervaloTemporizador();
    serviceWorkerRegistration.stopTimerInSW();
    
    // Limpiar la sesión activa en el estado de React (actualiza UI inmediatamente)
    setSesionActiva(null);
    setTiempoSesion(0);
    
    // Registrar la salida en el servicio
    // IMPORTANTE: Estamos pasando 'salida' como tipo y el nombre del empleado
    const result = fichajeService.registrarFichaje(
      'salida', 
      nombreEmpleado
    );
    
    if (result.success) {
      // Actualizar la lista de fichajes en el estado para que el historial se actualice
      // Usamos una función para asegurar que tenemos el estado más reciente
      setFichajes(fichajesActuales => {
        // Verificar si el fichaje de salida ya está en la lista
        const yaExiste = fichajesActuales.some(f => f.id === result.fichaje.id);
        if (yaExiste) {
          return fichajesActuales;
        }
        // Añadir el nuevo fichaje al principio del array
        return [result.fichaje, ...fichajesActuales];
      });
      
      // Limpiar la sesión en localStorage
      fichajeService.clearSesionActiva();
      
      // Para debug - mostrar los fichajes después de actualizar
      console.log('Fichajes actualizados después de salida:', 
                 fichajeService.getFichajes());
      
      return result;
    } else {
      // En caso de error, restaurar el estado anterior
      setError(result.message || 'Error al registrar salida');
      
      // Recuperar la información de la sesión activa de localStorage
      const sesionGuardada = fichajeService.getSesionActiva();
      if (sesionGuardada) {
        setSesionActiva(sesionGuardada);
        
        // Reiniciar el temporizador si no está pausada
        if (!sesionGuardada.pausada) {
          iniciarIntervaloTemporizador();
        }
      }
      
      return result;
    }
  } catch (err) {
    console.error("Error en registrarSalida:", err);
    const message = 'Error al registrar salida';
    setError(message);
    return { success: false, message };
  }
};
  
  // Pausar o reanudar la sesión
  const togglePausaSesion = (pausar) => {
    try {
      const result = fichajeService.togglePausaSesion(pausar);
      
      if (result.success) {
        // Actualizar el estado local primero
        setSesionActiva(result.sesion);
        
        // Si pausamos, detener el intervalo; si reanudamos, iniciarlo
        if (pausar) {
          detenerIntervaloTemporizador();
        } else {
          iniciarIntervaloTemporizador();
        }
        
        // Actualizar el estado de pausa en el Service Worker
        serviceWorkerRegistration.togglePauseTimerInSW(pausar);
        
        return result;
      } else {
        setError(result.message || 'Error al cambiar estado de pausa');
        return result;
      }
    } catch (err) {
      const message = 'Error al cambiar estado de pausa';
      setError(message);
      return { success: false, message };
    }
  };
  
  // Cancelar sesión activa
  const cancelarSesionActiva = () => {
    try {
      if (!sesionActiva) {
        return { success: false, message: 'No hay una sesión activa para cancelar' };
      }
      
      const entradaId = sesionActiva.id;
      
      // CORRECCIÓN: Primero actualizar estados locales
      // Detener el intervalo de actualización
      detenerIntervaloTemporizador();
      
      // Limpiar el estado local
      setSesionActiva(null);
      setTiempoSesion(0);
      
      // Detener el temporizador en el Service Worker
      serviceWorkerRegistration.stopTimerInSW();
      
      // Después eliminar el fichaje
      const result = fichajeService.eliminarFichaje(entradaId);
      
      if (result.success) {
        // Actualizar la lista de fichajes
        setFichajes(result.fichajes);
        
        // Limpiar la sesión en localStorage
        fichajeService.clearSesionActiva();
        return { success: true };
      } else {
        // En caso de error, restaurar el estado anterior
        setError(result.message || 'Error al cancelar la sesión');
        
        // CORRECCIÓN: Recuperar la información de la sesión activa
        const sesionGuardada = fichajeService.getSesionActiva();
        if (sesionGuardada) {
          setSesionActiva(sesionGuardada);
          
          // Reiniciar el temporizador si no está pausado
          if (!sesionGuardada.pausada) {
            iniciarIntervaloTemporizador();
          }
        }
        
        return result;
      }
    } catch (err) {
      const message = 'Error al cancelar la sesión';
      setError(message);
      return { success: false, message };
    }
  };
  
  // Editar fichaje
  const editarFichaje = (fichajeId, nuevaFecha) => {
    try {
      // Si es la entrada de una sesión activa, actualizar la sesión
      if (sesionActiva && sesionActiva.id === fichajeId) {
        const nuevaSesion = {
          ...sesionActiva,
          fechaInicio: nuevaFecha.toISOString(),
          // Resetear el tiempo acumulado, ya que estamos cambiando la hora de inicio
          tiempoAcumulado: 0,
          ultimaActualizacion: new Date().toISOString()
        };
        
        // Actualizar estado local
        setSesionActiva(nuevaSesion);
        setTiempoSesion(0);
        
        // Guardar en localStorage
        fichajeService.setSesionActiva(nuevaSesion);
        
        // Actualizar el temporizador en el Service Worker
        serviceWorkerRegistration.startTimerInSW(
          nuevaSesion.id,
          nuevaSesion.fechaInicio,
          nuevaSesion.tiempoAcumulado,
          nuevaSesion.pausada
        );
      }
      
      const result = fichajeService.editarFichaje(fichajeId, nuevaFecha);
      
      if (result.success) {
        setFichajes(result.fichajes);
      } else {
        setError(result.message || 'Error al editar fichaje');
      }
      
      return result;
    } catch (err) {
      const message = 'Error al editar fichaje';
      setError(message);
      return { success: false, message };
    }
  };
  
  // Eliminar fichaje
  const eliminarFichaje = (fichajeId) => {
    try {
      // Si es la entrada de una sesión activa, cancelar la sesión
      if (sesionActiva && sesionActiva.id === fichajeId) {
        return cancelarSesionActiva();
      }
      
      const result = fichajeService.eliminarFichaje(fichajeId);
      
      if (result.success) {
        setFichajes(result.fichajes);
      } else {
        setError(result.message || 'Error al eliminar fichaje');
      }
      
      return result;
    } catch (err) {
      const message = 'Error al eliminar fichaje';
      setError(message);
      return { success: false, message };
    }
  };
  
  // Obtener fichajes por período
  const getFichajesPorPeriodo = (fechaInicio, fechaFin) => {
    try {
      return fichajeService.getFichajesPorFecha(fechaInicio, fechaFin);
    } catch (err) {
      setError('Error al obtener fichajes por período');
      return [];
    }
  };
  
  // Obtener estadísticas básicas
  const getEstadisticas = (fechaInicio, fechaFin) => {
    try {
      return fichajeService.getEstadisticas(fechaInicio, fechaFin, sesionActiva);
    } catch (err) {
      setError('Error al obtener estadísticas');
      return null;
    }
  };
  
  // Obtener estadísticas detalladas
  const getEstadisticasDetalladas = (fechaInicio, fechaFin) => {
    try {
      return fichajeService.getEstadisticasDetalladas(fechaInicio, fechaFin, sesionActiva);
    } catch (err) {
      setError('Error al obtener estadísticas detalladas');
      return null;
    }
  };
  
  // Valor del contexto
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