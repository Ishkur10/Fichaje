import React, { useState, useEffect, useRef } from 'react';
import { LogIn, LogOut, Save, StopCircle, Timer, Play, Pause } from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';

// Componente de temporizador optimizado para prevenir parpadeos
const TemporizadorOptimizado = ({ colorBorde, colorTexto }) => {
  const { tiempoSesion, sesionActiva, togglePausaSesion } = useFichaje();
  const timerRef = useRef(null);
  
  // Prevenir renderizados innecesarios manteniendo la referencia
  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };
  
  // Actualizar el DOM directamente sin causar re-renders
  useEffect(() => {
    if (timerRef.current) {
      timerRef.current.textContent = formatearTiempo(tiempoSesion);
    }
  }, [tiempoSesion]);
  
  // Calcular porcentaje para el círculo de progreso (8 horas = 100%)
  const horasBase = 8 * 60 * 60; // 8 horas en segundos
  const porcentaje = Math.min(100, (tiempoSesion / horasBase) * 100);
  
  // Manejar pausa/reanudación
  const handleTogglePausa = () => {
    if (!sesionActiva) return;
    togglePausaSesion(!sesionActiva.pausada);
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className={`relative flex items-center justify-center w-36 h-36 rounded-full border-4 ${colorBorde}`}>
        <div 
          className="absolute top-0 left-0 w-full h-full rounded-full"
          style={{
            background: `conic-gradient(${colorBorde.replace('border-', 'rgb(var(--color-')}) ${porcentaje}%, transparent ${porcentaje}%)`,
            opacity: 0.2
          }}
        ></div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${colorTexto} tiempo-display`} ref={timerRef}>
            {formatearTiempo(tiempoSesion)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Tiempo trabajado
          </div>
        </div>
      </div>
      
      {sesionActiva && (
        <button 
          onClick={handleTogglePausa}
          className="mt-2 flex items-center text-sm text-gray-600 hover:text-gray-800"
        >
          {sesionActiva.pausada ? (
            <>
              <Play className="h-4 w-4 mr-1" /> Continuar
            </>
          ) : (
            <>
              <Pause className="h-4 w-4 mr-1" /> Pausar
            </>
          )}
        </button>
      )}
    </div>
  );
};

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
    
    // Registrar la entrada
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
    
    // Registrar la salida inmediatamente, sin retrasos
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
      // Cancelar la sesión inmediatamente, sin retrasos
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

  // Estilo para evitar parpadeos
  const noFlickerStyle = `
    .tiempo-display {
      transition: none;
    }
    .temporizador-container {
      will-change: contents;
    }
  `;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      {/* Estilo para evitar parpadeos */}
      <style>{noFlickerStyle}</style>
      
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
        
        {/* Mostrar temporizador o botón de entrada según el estado */}
        {sesionActiva ? (
          <div className={`flex flex-col items-center mb-6 p-4 rounded-lg temporizador-container ${
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
            
            <TemporizadorOptimizado 
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