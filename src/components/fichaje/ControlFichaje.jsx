import React from 'react';
import { LogIn, LogOut, Save } from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ControlFichaje = () => {
  const { registrarEntrada, registrarSalida, nombreEmpleado, setNombreEmpleado } = useFichaje();
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [nombreTemp, setNombreTemp] = React.useState(nombreEmpleado);

  // Actualizar reloj cada segundo
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Actualizar nombre temporal cuando cambia el nombre en el contexto
  React.useEffect(() => {
    setNombreTemp(nombreEmpleado);
  }, [nombreEmpleado]);

  // Manejar cambio de nombre
  const handleNombreChange = (e) => {
    setNombreTemp(e.target.value);
  };

  // Guardar nombre
  const handleGuardarNombre = () => {
    setNombreEmpleado(nombreTemp);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Control de Fichaje</h2>
      
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
      
      <div className="text-center mb-6">
        <div className="text-4xl font-bold mb-2">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="text-gray-600 mb-6">
          {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        
        <div className="flex justify-center gap-4">
          <Button 
            onClick={registrarEntrada}
            variant="primary"
            icon={<LogIn className="h-5 w-5" />}
          >
            Registrar Entrada
          </Button>
          
          <Button 
            onClick={registrarSalida}
            variant="danger"
            icon={<LogOut className="h-5 w-5" />}
          >
            Registrar Salida
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ControlFichaje;