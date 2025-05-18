import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Save, StopCircle, Timer } from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Temporizador from './Temporizador';
import Alert from '../ui/Alert';

const ControlFichaje = () => {
  const { 
    registrarEntrada, 
    registrarSalida, 
    nombreEmpleado, 
    setNombreEmpleado,
    sesionActiva,
    cancelarSesionActiva,
    getTiempoSesionActiva
  } = useFichaje();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nombreTemp, setNombreTemp] = useState(nombreEmpleado);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);
  const [alerta, setAlerta] = useState(null);
  
  // Actualizar reloj cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      
      // Si hay sesión activa, actualizar el tiempo transcurrido
      if (sesionActiva) {
        const segundos = getTiempoSesionActiva();
        setTiempoTranscurrido(segundos);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [sesionActiva, getTiempoSesionActiva]);
  
  // Actualizar nombre temporal cuando cambia el nombre en el contexto
  useEffect(() => {
    setNombreTemp(nombreEmpleado);
  }, [nombreEmpleado]);
  
  // Manejar cambio de nombre
  const handleNombreChange = (e) => {
    setNombreTemp(e.target.value);
  };
  
  // Guardar nombre
  const handleGuardarNombre = () => {
    if (!nombreTemp.trim()) {
      setAlerta({
        type: 'warning',
        message: 'Por favor, ingresa tu nombre para registrar los fichajes'
      });
      return;
    }
    
    setNombreEmpleado(nombreTemp.trim());
    setAlerta({
      type: 'success',
      message: '¡Nombre guardado correctamente!'
    });
    
    // Ocultar la alerta después de 3 segundos
    setTimeout(() => {
      setAlerta(null);
    }, 3000);
  };
  
  // Manejar registro de entrada
  const handleRegistrarEntrada = () => {
    if (!nombreEmpleado.trim()) {
      setAlerta({
        type: 'warning',
        message: 'Por favor, guarda tu nombre antes de registrar la entrada'
      });
      return;
    }
    
    const result = registrarEntrada();
    
    if (result.success) {
      setAlerta({
        type: 'success',
        message: '¡Entrada registrada correctamente!'
      });
    } else {
      setAlerta({
        type: 'error',
        message: result.message || 'Error al registrar entrada'
      });
    }
    
    // Ocultar la alerta después de 3 segundos
    setTimeout(() => {
      setAlerta(null);
    }, 3000);
  };
  
  // Manejar registro de salida
  const handleRegistrarSalida = () => {
    if (!sesionActiva) {
      setAlerta({
        type: 'warning',
        message: 'No hay una sesión activa para registrar la salida'
      });
      return;
    }
    
    const result = registrarSalida();
    
    if (result.success) {
      setAlerta({
        type: 'success',
        message: '¡Salida registrada correctamente!'
      });
    } else {
      setAlerta({
        type: 'error',
        message: result.message || 'Error al registrar salida'
      });
    }
    
    // Ocultar la alerta después de 3 segundos
    setTimeout(() => {
      setAlerta(null);
    }, 3000);
  };
  
  // Manejar cancelación de sesión
  const handleCancelarSesion = () => {
    if (window.confirm('¿Estás seguro de cancelar la sesión actual? Se eliminará el registro de entrada.')) {
      const result = cancelarSesionActiva();
      
      if (result.success) {
        setAlerta({
          type: 'info',
          message: 'Sesión cancelada correctamente'
        });
      } else {
        setAlerta({
          type: 'error',
          message: result.message || 'Error al cancelar la sesión'
        });
      }
      
      // Ocultar la alerta después de 3 segundos
      setTimeout(() => {
        setAlerta(null);
      }, 3000);
    }
  };
  
  // Formatear la fecha de inicio de sesión
  const formatearFechaInicio = () => {
    if (!sesionActiva) return '';
    
    const fecha = new Date(sesionActiva.fechaInicio);
    return fecha.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Control de Fichaje</h2>
      
      {/* Alerta de información */}
      {alerta && (
        <div className="mb-4">
          <Alert 
            type={alerta.type}
            message={alerta.message}
            onClose={() => setAlerta(null)}
          />
        </div>
      )}
      
      {/* Información del empleado */}
      <div className="mb-6">
        <div className="flex">
          <Input
            type="text"
            value={nombreTemp}
            onChange={handleNombreChange}
            placeholder="Ingresa tu nombre"
            label="Nombre del Empleado"
            className="flex-grow"
          />
          <div className="flex items-end ml-2">
            <Button 
              onClick={handleGuardarNombre}
              variant="success"
              icon={<Save className="h-4 w-4" />}
            >
              Guardar
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        {/* Vista del reloj */}
        <div className="text-center mb-4">
          <div className="text-4xl font-bold mb-2">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-gray-600">
            {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        
        {/* Sesión activa y temporizador */}
        {sesionActiva ? (
          <div className="flex flex-col items-center mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="mb-2 text-center">
              <div className="text-sm text-blue-600 font-medium">
                Sesión iniciada a las {formatearFechaInicio()}
              </div>
            </div>
            
            <Temporizador 
              tiempoInicial={tiempoTranscurrido}
              activo={true}
              colorBorde="border-blue-500"
              colorTexto="text-blue-700"
            />
            
            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <Button 
                onClick={handleRegistrarSalida}
                variant="primary"
                icon={<LogOut className="h-5 w-5" />}
                fullWidth
              >
                Registrar Salida
              </Button>
              
              <Button 
                onClick={handleCancelarSesion}
                variant="danger"
                icon={<StopCircle className="h-5 w-5" />}
                fullWidth
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-6">
            <Button 
              onClick={handleRegistrarEntrada}
              variant="primary"
              icon={<LogIn className="h-5 w-5" />}
              className="px-8"
            >
              Registrar Entrada
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlFichaje;