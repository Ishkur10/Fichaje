import React from 'react';
import { Play, Pause } from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';

const Temporizador = ({ 
  colorBorde = 'border-blue-500',
  colorTexto = 'text-blue-700' 
}) => {
  const { 
    tiempoSesion, 
    sesionActiva, 
    togglePausaSesion 
  } = useFichaje();
  
  // Función para formatear tiempo (hh:mm:ss)
  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };
  
  // Calcular el % de avance para el círculo (considerando 8 horas = 100%)
  const horasBase = 8 * 60 * 60; // 8 horas en segundos
  const porcentaje = Math.min(100, (tiempoSesion / horasBase) * 100);
  
  // Manejar la pausa/reanudación
  const handleTogglePausa = () => {
    if (!sesionActiva) return;
    togglePausaSesion(!sesionActiva.pausada);
  };
  
  // Formatear tiempo para mostrar
  const tiempoFormateado = formatearTiempo(tiempoSesion);
  
  // Depuración en consola
  console.log('Renderizando Temporizador, tiempo:', tiempoSesion, 'formateado:', tiempoFormateado);
  
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
          <div className={`text-2xl font-bold ${colorTexto}`} data-testid="timer-display">
            {tiempoFormateado}
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

export default Temporizador;