import React, { createContext, useState, useEffect } from 'react';
import fichajeService from '../services/fichajeService';

export const FichajeContext = createContext();

export const FichajeProvider = ({ children }) => {
  const [fichajes, setFichajes] = useState([]);
  const [nombreEmpleado, setNombreEmpleado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sesionActiva, setSesionActiva] = useState(null);
  
  useEffect(() => {
    const cargarDatos = () => {
      try {
        const storedFichajes = fichajeService.getFichajes();
        const storedNombre = fichajeService.getNombreEmpleado();
        
        setFichajes(storedFichajes);
        setNombreEmpleado(storedNombre);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos. Intente recargar la página.');
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, []);
  
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
        const nuevaSesion = {
          id: result.fichaje.id,
          fechaInicio: result.fichaje.fecha,
          empleado: nombreEmpleado
        };
        
        fichajeService.setSesionActiva(nuevaSesion);
        setSesionActiva(nuevaSesion);
        setFichajes(result.fichajes);
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
      
      // Registrar salida
      const result = fichajeService.registrarFichaje(
        'salida', 
        nombreEmpleado
      );
      
      if (result.success) {
        // Limpiar la sesión activa
        fichajeService.clearSesionActiva();
        setSesionActiva(null);
        setFichajes(result.fichajes);
      } else {
        setError(result.message || 'Error al registrar salida');
      }
      
      return result;
    } catch (err) {
      const message = 'Error al registrar salida';
      setError(message);
      return { success: false, message };
    }
  };
  
  // Obtener tiempo transcurrido de la sesión activa
  const getTiempoSesionActiva = () => {
    if (!sesionActiva) return null;
    
    const fechaInicio = new Date(sesionActiva.fechaInicio);
    const ahora = new Date();
    const tiempoTranscurrido = (ahora - fechaInicio) / 1000; // en segundos
    
    return tiempoTranscurrido;
  };
  
  // Cancelar sesión activa
  const cancelarSesionActiva = () => {
    try {
      if (!sesionActiva) {
        return { success: false, message: 'No hay una sesión activa para cancelar' };
      }
      
      const entradaId = sesionActiva.id;
      const result = fichajeService.eliminarFichaje(entradaId);
      
      if (result.success) {
        fichajeService.clearSesionActiva();
        setSesionActiva(null);
        setFichajes(result.fichajes);
        return { success: true };
      } else {
        setError(result.message || 'Error al cancelar la sesión');
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
          fechaInicio: nuevaFecha.toISOString()
        };
        fichajeService.setSesionActiva(nuevaSesion);
        setSesionActiva(nuevaSesion);
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
  
  const eliminarFichaje = (fichajeId) => {
    try {

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
  
  const getFichajesPorPeriodo = (fechaInicio, fechaFin) => {
    try {
      return fichajeService.getFichajesPorFecha(fechaInicio, fechaFin);
    } catch (err) {
      setError('Error al obtener fichajes por período');
      return [];
    }
  };
  
  const getEstadisticas = (fechaInicio, fechaFin) => {
    try {
      return fichajeService.getEstadisticas(fechaInicio, fechaFin, sesionActiva);
    } catch (err) {
      setError('Error al obtener estadísticas');
      return null;
    }
  };

  const getEstadisticasDetalladas = (fechaInicio, fechaFin) => {
    try {
      return fichajeService.getEstadisticasDetalladas(fechaInicio, fechaFin, sesionActiva);
    } catch (err) {
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
    registrarEntrada,
    registrarSalida,
    editarFichaje,
    eliminarFichaje,
    cancelarSesionActiva,
    getFichajesPorPeriodo,
    getEstadisticas,
    getEstadisticasDetalladas
  };
  
  return <FichajeContext.Provider value={value}>{children}</FichajeContext.Provider>;
};