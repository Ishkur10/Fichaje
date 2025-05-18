import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Save, StopCircle, Timer, Play, Pause } from 'lucide-react';
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
    togglePausaSesion
  } = useFichaje();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nombreTemp, setNombreTemp] = useState(nombreEmpleado);
  const [alerta, setAlerta] = useState(null);
  
  // Actualizar reloj cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
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
  
  // Manejar pausa/reanudación
  const handleTogglePausa = () => {
    const pausar = !sesionActiva?.pausada;
    
    const result = togglePausaSesion(pausar);
    
    if (result.success) {
      setAlerta({
        type: 'info',
        message: pausar ? 'Temporizador pausado' : 'Temporizador reanudado'
      });
    } else {
      setAlerta({
        type: 'error',
        message: result.message || 'Error al cambiar estado de pausa'
      });
    }
    
    // Ocultar la alerta después de 3 segundos
    setTimeout(() => {
      setAlerta(null);
    }, 3000);
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
          <div className={`flex flex-col items-center mb-6 p-4 rounded-lg ${
            sesionActiva.pausada ? 'bg-yellow-50' : 'bg-blue-50'
          }`}>
            <div className="mb-2 text-center">
              <div className={`text-sm font-medium ${
                sesionActiva.pausada ? 'text-yellow-600' : 'text-blue-600'
              }`}>
                Sesión iniciada a las {formatearFechaInicio()}
                {sesionActiva.pausada && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pausada
                  </span>
                )}
              </div>
            </div>
            
            <Temporizador 
              colorBorde={sesionActiva.pausada ? "border-yellow-500" : "border-blue-500"}
              colorTexto={sesionActiva.pausada ? "text-yellow-700" : "text-blue-700"}
            />
            
            <div className="grid grid-cols-3 gap-3 w-full mt-6">
              <Button 
                onClick={handleTogglePausa}
                variant={sesionActiva.pausada ? "warning" : "info"}
                icon={sesionActiva.pausada ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                fullWidth
              >
                {sesionActiva.pausada ? 'Reanudar' : 'Pausar'}
              </Button>
              
              <Button 
                onClick={handleRegistrarSalida}
                variant="primary"
                icon={<LogOut className="h-5 w-5" />}
                fullWidth
                disabled={sesionActiva.pausada}
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
            <button 
              onClick={() => {
                localStorage.removeItem('sesionActiva');
                window.location.reload();
              }}
              className="mt-4 text-xs text-red-600 underline"
            >
              Reiniciar si hay un problema con la sesión
            </button>
          </div>
        ) : (
          /* Botón de Registrar Entrada cuando no hay sesión activa */
          <div className="flex justify-center mb-6">
            <Button 
              onClick={handleRegistrarEntrada}
              variant="primary"
              icon={<LogIn className="h-5 w-5" />}
              className="px-8 py-3 text-lg"
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