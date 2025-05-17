import React, { useState, useEffect } from 'react';
import { X, Save, Clock } from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';
import Button from '../ui/Button';

const EditarFichajeModal = ({ fichaje, onClose }) => {
  const { editarFichaje } = useFichaje();
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (fichaje) {
      const fechaObj = new Date(fichaje.fecha);
      
      const fechaFormateada = fechaObj.toISOString().split('T')[0];
      setFecha(fechaFormateada);
      
      const horaFormateada = fechaObj.toTimeString().split(' ')[0];
      setHora(horaFormateada);
    }
  }, [fichaje]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      if (!fecha || !hora) {
        setError('Por favor, complete todos los campos');
        setLoading(false);
        return;
      }
      
    
      const [year, month, day] = fecha.split('-');
      const [hours, minutes, seconds] = hora.split(':');
      
      const nuevaFecha = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        seconds ? parseInt(seconds) : 0
      );
      
      if (isNaN(nuevaFecha.getTime())) {
        setError('Fecha u hora inválida');
        setLoading(false);
        return;
      }
      
      const result = await editarFichaje(fichaje.id, nuevaFecha);
      
      if (result.success) {
        onClose();
      } else {
        setError(result.message || 'Error al guardar cambios');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error al editar fichaje:', err);
      setError('Error al procesar la solicitud');
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Editar {fichaje?.tipo === 'entrada' ? 'Entrada' : 'Salida'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 text-red-700">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora
            </label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="1"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              onClick={onClose}
              variant="secondary"
              type="button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              icon={<Save className="h-4 w-4" />}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarFichajeModal;