import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // Mostrar pantalla de carga mientras se verifica la autenticación
    return <div className="min-h-screen flex justify-center items-center">Cargando...</div>;
  }

  if (!currentUser) {
    // Redirigir al login si no hay usuario autenticado
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;