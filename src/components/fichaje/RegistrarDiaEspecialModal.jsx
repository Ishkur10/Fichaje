import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle, Check, Gift, Heart, Stethoscope } from 'lucide-react';
import Button from '../ui/Button';
import { 
  registrarDiaEspecial, 
  TIPOS_DIA_ESPECIAL, 
  getTipoDisplayName,
  getTipoColorClasses,
  getHorasLaborablesPorDia,
  puedeRegistrarDiaEspecial
} from '../../utils/diasEspecialesUtils';

const RegistrarDiaEspecialModal = ({ isOpen, onClose, onSuccess, empleado, fechaInicial = null }) => {
  const [fecha, setFecha] = useState('');
  const [tipo, setTipo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [horasCalculadas, setHorasCalculadas] = useState(0);
  const [puedeRegistrar, setPuedeRegistrar] = useState({ puede: true, razon: '' });

  useEffect(() => {
    if (isOpen) {
      const hoy = new Date();
      const fechaFormateada = fechaInicial 
        ? fechaInicial.toISOString().split('T')[0]
        : hoy.toISOString().split('T')[0];
      
      setFecha(fechaFormateada);
      setTipo('');
      setMotivo('');
      setError('');
      setHorasCalculadas(0);
    }
  }, [isOpen, fechaInicial]);

  useEffect(() => {
    if (fecha && empleado) {
      const fechaObj = new Date(fecha);
      const verificacion = puedeRegistrarDiaEspecial(fechaObj, empleado);
      setPuedeRegistrar(verificacion);
      
      if (tipo) {
        const horas = getHorasLaborablesPorDia(fechaObj);
        setHorasCalculadas(horas);
      }
    }
  }, [fecha, empleado, tipo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!fecha || !tipo || !motivo.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (!puedeRegistrar.puede) {
      setError(puedeRegistrar.razon);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fechaObj = new Date(fecha);
      const resultado = registrarDiaEspecial(fechaObj, tipo, motivo.trim(), empleado);

      if (resultado.success) {
        onSuccess(resultado);
        onClose();
      } else {
        setError(resultado.message);
      }
    } catch (err) {
      setError('Error al registrar el día especial');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const tiposDisponibles = [
    {
      id: TIPOS_DIA_ESPECIAL.FESTIVO_MANUAL,
      nombre: 'Hoy es Festivo',
      descripcion: 'Marcar el día como festivo',
      icon: <Gift className="h-5 w-5" />,
      ejemplos: ['Día del patrón local', 'Festivo autonómico no registrado', 'Festivo trasladado']
    },
    {
      id: TIPOS_DIA_ESPECIAL.FIESTA_PERSONAL,
      nombre: 'Me lo he Pillado de Fiesta',
      descripcion: 'Día personal de descanso',
      icon: <Heart className="h-5 w-5" />,
      ejemplos: ['Día libre personal', 'Asunto propio', 'Día de fiesta personal']
    },
    {
      id: TIPOS_DIA_ESPECIAL.BAJA_LABORAL,
      nombre: 'Baja Laboral',
      descripcion: 'Día de baja médica o laboral',
      icon: <Stethoscope className="h-5 w-5" />,
      ejemplos: ['Baja médica', 'Incapacidad temporal', 'Accidente laboral']
    }
  ];

  if (!isOpen) return null;

  const tipoSeleccionado = tiposDisponibles.find(t => t.id === tipo);
  const colorClasses = tipo ? getTipoColorClasses(tipo) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Registrar Día Especial
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selector de fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            {!puedeRegistrar.puede && fecha && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {puedeRegistrar.razon}
              </p>
            )}
          </div>

          {/* Selector de tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de día especial
            </label>
            <div className="space-y-3">
              {tiposDisponibles.map((tipoOpcion) => (
                <div
                  key={tipoOpcion.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    tipo === tipoOpcion.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setTipo(tipoOpcion.id)}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="tipo"
                      value={tipoOpcion.id}
                      checked={tipo === tipoOpcion.id}
                      onChange={(e) => setTipo(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center flex-1">
                      <div className="text-blue-600 mr-3">
                        {tipoOpcion.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {tipoOpcion.nombre}
                        </div>
                        <div className="text-sm text-gray-600">
                          {tipoOpcion.descripcion}
                        </div>
                      </div>
                      {tipo === tipoOpcion.id && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Información de horas */}
          {tipo && fecha && (
            <div className={`p-4 rounded-lg border-2 ${colorClasses?.border} ${colorClasses?.bg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${colorClasses?.text}`}>
                    Horas a registrar
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(fecha).toLocaleDateString('es', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-xl font-bold text-gray-800">
                    {horasCalculadas}h
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Campo de motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo / Descripción
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={tipoSeleccionado ? 
                `Ej: ${tipoSeleccionado.ejemplos[0]}` : 
                'Describe el motivo del día especial'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows="3"
              required
            />
            <div className="mt-1 text-xs text-gray-500">
              {motivo.length}/200 caracteres
            </div>
          </div>

          {/* Ejemplos para el tipo seleccionado */}
          {tipoSeleccionado && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Ejemplos de motivos:
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                {tipoSeleccionado.ejemplos.map((ejemplo, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                    {ejemplo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading || !puedeRegistrar.puede}
              isLoading={loading}
            >
              {loading ? 'Registrando...' : 'Registrar Día'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrarDiaEspecialModal;
