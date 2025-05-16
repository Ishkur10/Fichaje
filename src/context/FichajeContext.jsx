import React, { createContext, useState, useEffect } from 'react';
import fichajeService from '../services/fichajeService';

// Crear contexto
export const FichajeContext = createContext();

export const FichajeProvider = ({ children }) => {
  const [fichajes, setFichajes] = useState([]);
  const [nombreEmpleado, setNombreEmpleado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Cargar fichajes al iniciar
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
      const result = fichajeService.registrarFichaje(
        'entrada', 
        nombreEmpleado
      );
      
      if (result.success) {
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
      const result = fichajeService.registrarFichaje(
        'salida', 
        nombreEmpleado
      );
      
      if (result.success) {
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
  
  // Eliminar fichaje
  const eliminarFichaje = (fichajeId) => {
    try {
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
  
  // Obtener estadísticas
  const getEstadisticas = (fechaInicio, fechaFin) => {
    try {
      return fichajeService.getEstadisticas(fechaInicio, fechaFin);
    } catch (err) {
      setError('Error al obtener estadísticas');
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
    registrarEntrada,
    registrarSalida,
    eliminarFichaje,
    getFichajesPorPeriodo,
    getEstadisticas
  };
  
  return <FichajeContext.Provider value={value}>{children}</FichajeContext.Provider>;
};