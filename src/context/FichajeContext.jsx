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
  console.log("Iniciando intervalo del temporizador...");
  
  // Limpiar cualquier intervalo existente primero
  if (timerInterval.current) {
    console.log("Limpiando intervalo existente");
    clearInterval(timerInterval.current);
    timerInterval.current = null;
  }
  
  // Configurar un nuevo intervalo para actualizar el tiempo cada segundo
  timerInterval.current = setInterval(() => {
    // Calcular el tiempo transcurrido usando la función de fichajeService
    const tiempoCalculado = fichajeService.calcularTiempoSesionActiva();
    
    // Actualizar el estado con el nuevo tiempo
    setTiempoSesion(tiempoCalculado);
    
    // Depuración
    console.log("Actualización de temporizador:", tiempoCalculado, "segundos");
  }, 1000);
  
  console.log("Intervalo establecido con ID:", timerInterval.current);
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
        console.log("Cargando datos iniciales...");
        // Cargar fichajes y nombre de empleado
        const storedFichajes = fichajeService.getFichajes();
        const storedNombre = fichajeService.getNombreEmpleado();
        
        setFichajes(storedFichajes);
        setNombreEmpleado(storedNombre);
        
        // Verificar si hay una sesión activa válida
        const sesionGuardada = fichajeService.getSesionActiva();
        console.log("Sesión guardada encontrada:", sesionGuardada);
        
        if (sesionGuardada) {
          // Verificar que la sesión tiene los datos mínimos necesarios
          if (sesionGuardada.id && sesionGuardada.fechaInicio) {
            // Verificar que existe un fichaje de entrada correspondiente
            const entradaExiste = storedFichajes.some(
              (fichaje) => fichaje.id === sesionGuardada.id && fichaje.tipo === 'entrada'
            );
            
            if (entradaExiste) {
              console.log("Sesión válida encontrada, activando...");
              // La sesión es válida, aseguramos que tenga ultimaActualizacion
              let sesionActualizada = {...sesionGuardada};
              
              // IMPORTANTE: Asegurarnos de que ultimaActualizacion esté establecido
              if (!sesionActualizada.ultimaActualizacion) {
                sesionActualizada.ultimaActualizacion = sesionActualizada.fechaInicio;
                fichajeService.setSesionActiva(sesionActualizada);
              }
              
              // Activar la sesión en el estado de React
              setSesionActiva(sesionActualizada);
              
              // Calcular el tiempo transcurrido correctamente
              const tiempoCalculado = fichajeService.calcularTiempoSesionActiva();
              console.log("Tiempo calculado:", tiempoCalculado);
              setTiempoSesion(tiempoCalculado);
              
              // Iniciar el Service Worker de manera segura
              try {
                serviceWorkerRegistration.startTimerInSW(
                  sesionActualizada.id,
                  sesionActualizada.fechaInicio,
                  sesionActualizada.tiempoAcumulado || 0,
                  sesionActualizada.pausada || false
                );
              } catch (swError) {
                console.warn('Error al iniciar el temporizador en el Service Worker:', swError);
                // Continuamos aunque falle el SW
              }
              
              // Solo iniciar el intervalo si la sesión no está pausada
              if (!sesionActualizada.pausada) {
                iniciarIntervaloTemporizador();
              }
            } else {
              // No hay fichaje de entrada correspondiente, limpiamos la sesión
              console.warn('Sesión inválida detectada (no hay fichaje correspondiente). Limpiando...');
              fichajeService.clearSesionActiva();
            }
          } else {
            // Sesión inválida, la limpiamos
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
      // Limpiar el intervalo y detener el temporizador al desmontar
      detenerIntervaloTemporizador();
      try {
        serviceWorkerRegistration.stopTimerInSW();
      } catch (error) {
        console.warn('Error al detener el temporizador en el Service Worker:', error);
      }
    };
  }, []);
  
  // Efecto para manejar cambios en el estado de pausa de la sesión
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
  
  // Escuchar eventos de visibilidad de la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log("Visibilidad cambiada:", document.visibilityState);
      
      if (document.visibilityState === 'visible') {
        // Cuando la página vuelve a ser visible y hay una sesión activa,
        // recalculamos el tiempo transcurrido usando el método timestamp
        if (sesionActiva) {
          console.log("Página visible con sesión activa, recalculando tiempo...");
          
          // Recalcular el tiempo transcurrido según el tiempo real
          const tiempoCalculado = fichajeService.calcularTiempoSesionActiva();
          console.log("Tiempo recalculado:", tiempoCalculado);
          setTiempoSesion(tiempoCalculado);
          
          // Solo reiniciar el intervalo si la sesión no está pausada
          if (!sesionActiva.pausada) {
            iniciarIntervaloTemporizador();
          }
        }
      } else if (document.visibilityState === 'hidden') {
        // Cuando la página deja de ser visible, pausamos el intervalo para ahorrar recursos
        // pero NO pausamos la sesión activa - solo detenemos la actualización de la UI
        console.log("Página oculta, deteniendo intervalo de UI");
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
      console.log("Registrando entrada...");
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
        console.log("Entrada registrada correctamente:", result.fichaje);
        
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
        setFichajes(prevFichajes => [result.fichaje, ...prevFichajes]);
        
        // Guardar en localStorage
        fichajeService.setSesionActiva(nuevaSesion);
        
        // Iniciar el temporizador en el Service Worker de manera segura
        try {
          serviceWorkerRegistration.startTimerInSW(
            nuevaSesion.id,
            nuevaSesion.fechaInicio,
            nuevaSesion.tiempoAcumulado,
            nuevaSesion.pausada
          );
        } catch (swError) {
          console.warn('Error al iniciar el temporizador en el Service Worker:', swError);
          // Continuamos aunque falle el SW
        }
        
        // Iniciar el intervalo del temporizador
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
      // Verificar si hay una sesión activa
      if (!sesionActiva) {
        setError('No hay ninguna sesión activa para registrar la salida.');
        return { 
          success: false, 
          message: 'No hay sesión activa' 
        };
      }
      
      // Detener el intervalo de actualización primero
      detenerIntervaloTemporizador();
      
      // Intentar comunicarse con el Service Worker de manera segura
      try {
        serviceWorkerRegistration.stopTimerInSW();
      } catch (swError) {
        console.warn('Error al comunicarse con el Service Worker:', swError);
        // Continuamos con el proceso aunque falle la comunicación con el SW
      }
      
      // Limpiar la sesión activa en el estado de React (actualiza UI inmediatamente)
      setSesionActiva(null);
      setTiempoSesion(0);
      
      // Registrar la salida en el servicio
      const result = fichajeService.registrarFichaje(
        'salida', 
        nombreEmpleado
      );
      
      if (result.success) {
        console.log("Salida registrada correctamente:", result.fichaje);
        
        // Actualizar la lista de fichajes en el estado para que el historial se actualice
        setFichajes(prevFichajes => [result.fichaje, ...prevFichajes]);
        
        // Limpiar la sesión en localStorage
        fichajeService.clearSesionActiva();
        
        return result;
      } else {
        // En caso de error, restaurar el estado anterior
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
  
  // Pausar o reanudar la sesión
  const togglePausaSesion = (pausar) => {
    try {
      console.log(`${pausar ? 'Pausando' : 'Reanudando'} sesión...`);
      
      if (!sesionActiva) {
        return {
          success: false,
          message: 'No hay sesión activa para pausar/reanudar'
        };
      }
      
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
        
        // Actualizar el estado de pausa en el Service Worker de manera segura
        try {
          serviceWorkerRegistration.togglePauseTimerInSW(pausar);
        } catch (swError) {
          console.warn('Error al comunicarse con el Service Worker:', swError);
          // Continuamos aunque falle el SW
        }
        
        return result;
      } else {
        setError(result.message || 'Error al cambiar estado de pausa');
        return result;
      }
    } catch (err) {
      console.error("Error en togglePausaSesion:", err);
      const message = 'Error al cambiar estado de pausa';
      setError(message);
      return { success: false, message };
    }
  };
  
  // Cancelar sesión activa
  const cancelarSesionActiva = () => {
    try {
      console.log("Cancelando sesión activa...");
      
      if (!sesionActiva) {
        return { success: false, message: 'No hay una sesión activa para cancelar' };
      }
      
      const entradaId = sesionActiva.id;
      
      // Primero detener todos los temporizadores
      detenerIntervaloTemporizador();
      
      // Comunicarse con el Service Worker de manera segura
      try {
        serviceWorkerRegistration.stopTimerInSW();
      } catch (swError) {
        console.warn('Error al comunicarse con el Service Worker:', swError);
        // Continuamos aunque falle el SW
      }
      
      // Limpiar el estado local
      setSesionActiva(null);
      setTiempoSesion(0);
      
      // Después eliminar el fichaje
      const result = fichajeService.eliminarFichaje(entradaId);
      
      if (result.success) {
        console.log("Sesión cancelada correctamente");
        
        // Actualizar la lista de fichajes
        setFichajes(result.fichajes);
        
        // Limpiar la sesión en localStorage
        fichajeService.clearSesionActiva();
        return { success: true };
      } else {
        // En caso de error, mostrar mensaje
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
  
  // Editar fichaje
  const editarFichaje = (fichajeId, nuevaFecha) => {
    try {
      console.log(`Editando fichaje ${fichajeId} a fecha ${nuevaFecha}`);
      
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
        
        // Comunicarse con el Service Worker de manera segura
        try {
          // Actualizar el temporizador en el Service Worker
          serviceWorkerRegistration.startTimerInSW(
            nuevaSesion.id,
            nuevaSesion.fechaInicio,
            nuevaSesion.tiempoAcumulado,
            nuevaSesion.pausada
          );
        } catch (swError) {
          console.warn('Error al comunicarse con el Service Worker:', swError);
          // Continuamos aunque falle el SW
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
  
  // Eliminar fichaje
  const eliminarFichaje = (fichajeId) => {
    try {
      console.log(`Eliminando fichaje ${fichajeId}`);
      
      // Si es la entrada de una sesión activa, cancelar la sesión
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
  
  // Obtener fichajes por período
  const getFichajesPorPeriodo = (fechaInicio, fechaFin) => {
    try {
      return fichajeService.getFichajesPorFecha(fechaInicio, fechaFin);
    } catch (err) {
      console.error("Error en getFichajesPorPeriodo:", err);
      setError('Error al obtener fichajes por período');
      return [];
    }
  };
  
  // Obtener estadísticas básicas
  const getEstadisticas = (fechaInicio, fechaFin) => {
    try {
      return fichajeService.getEstadisticas(fechaInicio, fechaFin, sesionActiva);
    } catch (err) {
      console.error("Error en getEstadisticas:", err);
      setError('Error al obtener estadísticas');
      return null;
    }
  };
  
  // Obtener estadísticas detalladas
  const getEstadisticasDetalladas = (fechaInicio, fechaFin) => {
    try {
      return fichajeService.getEstadisticasDetalladas(fechaInicio, fechaFin, sesionActiva);
    } catch (err) {
      console.error("Error en getEstadisticasDetalladas:", err);
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