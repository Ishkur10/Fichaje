import React, { useState, useEffect, useRef } from 'react';
import { LogIn, LogOut, Save, StopCircle, Timer, Play, Pause, Gift, Award, Calendar, Plus } from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import RegistrarDiaEspecialModal from './RegistrarDiaEspecialModal';

const TemporizadorOptimizado = ({ colorBorde, colorTexto }) => {
  const { tiempoSesion, sesionActiva, togglePausaSesion } = useFichaje();
  const timerRef = useRef(null);
  
  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };
  

  useEffect(() => {
    if (timerRef.current) {
      timerRef.current.textContent = formatearTiempo(tiempoSesion);
    }
  }, [tiempoSesion]);
  
  const horasBase = 8 * 60 * 60; 
  const porcentaje = Math.min(100, (tiempoSesion / horasBase) * 100);

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
    togglePausaSesion,
    verificarFestivo,
    getResumenHorasExtras
  } = useFichaje();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nombreTemp, setNombreTemp] = useState(nombreEmpleado);
  const [alerta, setAlerta] = useState(null);
  const [infoContexto, setInfoContexto] = useState(null);
  const [modalDiaEspecialAbierto, setModalDiaEspecialAbierto] = useState(false);
  

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Efecto para obtener información de contexto del día
  useEffect(() => {
    const hoy = new Date();
    const infoFestivo = verificarFestivo(hoy);
    
    // Obtener resumen de horas extras de la semana actual
    const inicioSemana = new Date(hoy);
    const dia = inicioSemana.getDay();
    const diferencia = dia === 0 ? -6 : 1 - dia;
    inicioSemana.setDate(hoy.getDate() + diferencia);
    inicioSemana.setHours(0, 0, 0, 0);
    
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);
    
    const resumenSemana = getResumenHorasExtras(inicioSemana, finSemana);
    
    setInfoContexto({
      esFestivo: infoFestivo.esFestivo,
      nombreFestivo: infoFestivo.nombre,
      tipoFestivo: infoFestivo.tipo,
      horasExtrasSemana: resumenSemana.horasExtrasTotal || 0,
      semanasConExtras: resumenSemana.semanas?.filter(s => s.horasExtras > 0).length || 0
    });
  }, [verificarFestivo, getResumenHorasExtras]);
  
  
  useEffect(() => {
    setNombreTemp(nombreEmpleado);
  }, [nombreEmpleado]);
  

  const handleNombreChange = (e) => {
    setNombreTemp(e.target.value);
  };
  

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
    
  
    setTimeout(() => {
      setAlerta(null);
    }, 3000);
  };
  
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
    
    setTimeout(() => {
      setAlerta(null);
    }, 3000);
  };
  

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
      let mensaje = '¡Salida registrada correctamente!';
      let tipo = 'success';
      
      // Verificar si hay información de horas extras
      if (result.horasExtrasInfo) {
        const horasExtras = result.horasExtrasInfo;
        
        if (horasExtras.horasExtrasDetectadas) {
          mensaje = `¡Salida registrada! 🎉 ${horasExtras.mensaje}`;
          tipo = 'success';
        } else {
          mensaje = `¡Salida registrada! ${horasExtras.mensaje}`;
        }
      }
      
      setAlerta({
        type: tipo,
        message: mensaje
      });
      
      // Mostrar alerta por más tiempo si hay horas extras
      const tiempoAlerta = result.horasExtrasInfo?.horasExtrasDetectadas ? 5000 : 3000;
      
      setTimeout(() => {
        setAlerta(null);
      }, tiempoAlerta);
    } else {
      setAlerta({
        type: 'error',
        message: result.message || 'Error al registrar salida'
      });
      
      setTimeout(() => {
        setAlerta(null);
      }, 3000);
    }
  };
  
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

      setTimeout(() => {
        setAlerta(null);
      }, 3000);
    }
  };
  
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
    
    setTimeout(() => {
      setAlerta(null);
    }, 3000);
  };
  
  const handleDiaEspecialSuccess = (resultado) => {
    setAlerta({
      type: 'success',
      message: `🎉 ${resultado.message} - ${resultado.diaEspecial.horas}h registradas`
    });
    
    setTimeout(() => {
      setAlerta(null);
    }, 4000);
  };
  
  const handleAbrirModalDiaEspecial = () => {
    if (!nombreEmpleado.trim()) {
      setAlerta({
        type: 'warning',
        message: 'Por favor, guarda tu nombre antes de registrar un día especial'
      });
      
      setTimeout(() => {
        setAlerta(null);
      }, 3000);
      
      return;
    }
    
    setModalDiaEspecialAbierto(true);
  };

  const formatearFechaInicio = () => {
    if (!sesionActiva) return '';
    
    const fecha = new Date(sesionActiva.fechaInicio);
    return fecha.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

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
            className='mb-4 p-4'
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
          
          {/* Información de contexto */}
          {infoContexto && (
            <div className="mt-3 space-y-2">
              {infoContexto.esFestivo && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <Gift className="h-4 w-4 mr-2" />
                  {infoContexto.nombreFestivo}
                </div>
              )}
              
              {infoContexto.horasExtrasSemana > 0 && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 ml-2">
                  <Award className="h-4 w-4 mr-2" />
                  {infoContexto.horasExtrasSemana.toFixed(1)}h extras esta semana
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Mostrar temporizador o botón de entrada según el estado */}
        {sesionActiva ? (
          <div className={`flex flex-col items-center mb-6 rounded-lg temporizador-container ${
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
              className='p-4'
                onClick={handleTogglePausa}
                variant={sesionActiva.pausada ? "warning" : "info"}
                icon={sesionActiva.pausada ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                fullWidth
              >
                {sesionActiva.pausada ? 'Reanudar' : 'Pausar'}
              </Button>
              
              <Button 
                className='p-4'
                onClick={handleRegistrarSalida}
                variant="primary"
                icon={<LogOut className="h-5 w-5" />}
                fullWidth
                disabled={sesionActiva.pausada}
              >
                Registrar Salida
              </Button>
              
              <Button 
              className='p-4'
                onClick={handleCancelarSesion}
                variant="danger"
                icon={<StopCircle className="h-5 w-5" />}
                fullWidth
              >
                Cancelar
              </Button>
            </div>
            
            {/* Botón para días especiales durante sesión activa */}
            <div className="mt-4 w-full">
              <Button 
                onClick={handleAbrirModalDiaEspecial}
                variant="secondary"
                icon={<Calendar className="h-4 w-4" />}
                className="w-full text-sm"
              >
                Registrar Día Especial
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
          /* Botones cuando no hay sesión activa */
          <div className="space-y-4">
            {/* Botón de Registrar Entrada */}
            <div className="flex justify-center">
              <Button 
                onClick={handleRegistrarEntrada}
                variant="primary"
                icon={<LogIn className="h-5 w-5" />}
                className="px-8 py-3 text-lg"
              >
                Registrar Entrada
              </Button>
            </div>
            
            {/* Botones para días especiales */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
                ¿No vas a trabajar hoy?
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={handleAbrirModalDiaEspecial}
                  variant="secondary"
                  icon={<Plus className="h-4 w-4" />}
                  className="w-full text-sm"
                >
                  Registrar Día Especial
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Festivos, bajas laborales, días personales, etc.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal para registrar día especial */}
      <RegistrarDiaEspecialModal
        isOpen={modalDiaEspecialAbierto}
        onClose={() => setModalDiaEspecialAbierto(false)}
        onSuccess={handleDiaEspecialSuccess}
        empleado={nombreEmpleado}
        fechaInicial={new Date()}
      />
    </div>
  );
};

export default ControlFichaje;