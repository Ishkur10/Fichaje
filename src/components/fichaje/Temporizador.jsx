import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause } from 'lucide-react';

const formatearTiempo = (segundos) => {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = Math.floor(segundos % 60);
  
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
};

const Temporizador = ({ 
  tiempoInicial = 0, 
  activo = false, 
  colorBorde = 'border-blue-500',
  colorTexto = 'text-blue-700' 
}) => {
  const [tiempo, setTiempo] = useState(tiempoInicial);
  const [pausa, setPausa] = useState(false);

  useEffect(() => {
    let intervalo = null;
    
    if (activo && !pausa) {
      intervalo = setInterval(() => {
        setTiempo(prevTiempo => prevTiempo + 1);
      }, 1000);
    } else {
      clearInterval(intervalo);
    }
    
    return () => clearInterval(intervalo);
  }, [activo, pausa]);
  

  const tiempoFormateado = formatearTiempo(tiempo);
  

  const horasBase = 8 * 60 * 60; 
  const porcentaje = Math.min(100, (tiempo / horasBase) * 100);
  
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
          <div className={`text-2xl font-bold ${colorTexto}`}>
            {tiempoFormateado}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Tiempo trabajado
          </div>
        </div>
      </div>
      
      {activo && (
        <button 
          onClick={() => setPausa(!pausa)}
          className="mt-2 flex items-center text-sm text-gray-600 hover:text-gray-800"
        >
          {pausa ? (
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