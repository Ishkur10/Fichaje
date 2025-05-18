import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause } from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';

const formatearTiempo = (segundos) => {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = Math.floor(segundos % 60);
  
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
};

const Temporizador = ({ 
  colorBorde = 'border-blue-500',
  colorTexto = 'text-blue-700' 
}) => {
  const { 
    tiempoSesion, 
    sesionActiva, 
    togglePausaSesion 
  } = useFichaje();
  
  // Usamos un ref para referenciar los elementos DOM de los dígitos
  const horasRef = useRef(null);
  const minutosRef = useRef(null);
  const segundosRef = useRef(null);
  
  // Formateamos y separamos los componentes de tiempo
  const horasStr = Math.floor(tiempoSesion / 3600).toString().padStart(2, '0');
  const minutosStr = Math.floor((tiempoSesion % 3600) / 60).toString().padStart(2, '0');
  const segundosStr = Math.floor(tiempoSesion % 60).toString().padStart(2, '0');
  
  // Efecto para actualizar suavemente los dígitos sin parpadeos
  useEffect(() => {
    if (horasRef.current) horasRef.current.textContent = horasStr;
    if (minutosRef.current) minutosRef.current.textContent = minutosStr;
    if (segundosRef.current) segundosRef.current.textContent = segundosStr;
  }, [horasStr, minutosStr, segundosStr]);
  
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
      <div className={`relative flex items-center justify-center w-36 h-36 rounded-full border-4 ${colorBorde} transition-all duration-300`}>
        <div 
          className="absolute top-0 left-0 w-full h-full rounded-full transition-all duration-300"
          style={{
            background: `conic-gradient(${colorBorde.replace('border-', 'rgb(var(--color-')}) ${porcentaje}%, transparent ${porcentaje}%)`,
            opacity: 0.2
          }}
        ></div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${colorTexto} transition-none`}>
            <span ref={horasRef}>{horasStr}</span>:
            <span ref={minutosRef}>{minutosStr}</span>:
            <span ref={segundosRef}>{segundosStr}</span>
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
