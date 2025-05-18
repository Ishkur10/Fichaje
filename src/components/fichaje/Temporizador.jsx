import React, { useRef, useEffect } from 'react';
import { Clock, Play, Pause } from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';

// Componente de temporizador optimizado para prevenir parpadeos y reinicio
const TemporizadorOptimizado = ({ 
  colorBorde = 'border-blue-500',
  colorTexto = 'text-blue-700' 
}) => {
  const { 
    tiempoSesion, 
    sesionActiva, 
    togglePausaSesion 
  } = useFichaje();
  
  // Referencia al elemento del temporizador
  const timerRef = useRef(null);
  
  // Función para formatear tiempo (no cambia entre renderizados)
  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };
  
  // Actualizar sólo el texto del temporizador cuando cambia el tiempo
  useEffect(() => {
    if (timerRef.current) {
      // Esta línea es clave: actualiza solo el contenido de texto sin re-renderizar
      timerRef.current.textContent = formatearTiempo(tiempoSesion);
    }
  }, [tiempoSesion]);
  
  // Calcular el % de avance para el círculo (considerando 8 horas = 100%)
  const horasBase = 8 * 60 * 60; // 8 horas en segundos
  const porcentaje = Math.min(100, (tiempoSesion / horasBase) * 100);
  
  // Manejar la pausa/reanudación
  const handleTogglePausa = () => {
    if (!sesionActiva) return;
    togglePausaSesion(!sesionActiva.pausada);
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className={`relative flex items-center justify-center w-36 h-36 rounded-full border-4 ${colorBorde} transition-colors duration-300`}>
        <div 
          className="absolute top-0 left-0 w-full h-full rounded-full transition-all duration-300"
          style={{
            background: `conic-gradient(${colorBorde.replace('border-', 'rgb(var(--color-')}) ${porcentaje}%, transparent ${porcentaje}%)`,
            opacity: 0.2
          }}
        ></div>
        
        <div className="text-center">
          {/* Usamos la referencia para actualizar directamente el DOM */}
          <div className={`text-2xl font-bold ${colorTexto} timer-text`} ref={timerRef}>
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

export default TemporizadorOptimizado;