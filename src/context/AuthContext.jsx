import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

// Crear contexto
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Verificar si hay una sesión activa al cargar
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);
  
  // Registrar usuario
  const register = async (nombre, email, password) => {
    setError('');
    const result = authService.register(nombre, email, password);
    
    if (result.success) {
      setCurrentUser(result.user);
      return result;
    } else {
      setError(result.message);
      return result;
    }
  };
  
  // Iniciar sesión
  const login = async (email, password) => {
    setError('');
    const result = authService.login(email, password);
    
    if (result.success) {
      setCurrentUser(result.user);
      return result;
    } else {
      setError(result.message);
      return result;
    }
  };
  
  // Cerrar sesión
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };
  
  // Actualizar usuario
  const updateUser = (userData) => {
    setError('');
    const result = authService.updateUser(userData);
    
    if (result.success) {
      setCurrentUser(result.user);
      return result;
    } else {
      setError(result.message);
      return result;
    }
  };
  
  // Valor del contexto
  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    updateUser
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};