import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Star,
  Clock
} from 'lucide-react';
import { 
  obtenerFestivosAño, 
  esFestivo,
  esDiaLaborable 
} from '../../utils/festivosUtils';

const InfoFestivos = () => {
  const [expandido, setExpandido] = useState(false);
  const [festivosAño, setFestivosAño] = useState([]);
  const [añoActual, setAñoActual] = useState(new Date().getFullYear());

  useEffect(() => {
    const festivos = obtenerFestivosAño(añoActual, true);
    setFestivosAño(festivos);
  }, [añoActual]);

  const festivosRestantes = festivosAño.filter(festivo => {
    return festivo.fecha >= new Date();
  });

  const festivosPasados = festivosAño.filter(festivo => {
    return festivo.fecha < new Date();
  });

  const proximoFestivo = festivosRestantes.length > 0 ? festivosRestantes[0] : null;

  const festivos = {
    nacionales: festivosAño.filter(f => f.tipo === 'nacional'),
    autonomicos: festivosAño.filter(f => f.tipo === 'autonómico'),
    variables: festivosAño.filter(f => f.tipo === 'variable')
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpandido(!expandido)}
      >
        <h2 className="text-xl font-semibold flex items-center">
          <Gift className="h-5 w-5 mr-2 text-yellow-600" />
          Días Festivos {añoActual}
        </h2>
        <button className="flex items-center text-gray-500 hover:text-gray-700">
          <Info className="h-4 w-4 mr-1" />
          <span className="text-sm mr-2">
            {festivosAño.length} festivos
          </span>
          {expandido ? 
            <ChevronUp className="h-5 w-5" /> : 
            <ChevronDown className="h-5 w-5" />
          }
        </button>
      </div>

      {/* Resumen rápido */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {proximoFestivo && (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <h3 className="text-sm text-yellow-800 font-medium mb-1">
              Próximo Festivo
            </h3>
            <p className="text-lg font-bold text-yellow-700">
              {proximoFestivo.fecha.toLocaleDateString('es', { 
                day: 'numeric', 
                month: 'short' 
              })}
            </p>
            <p className="text-xs text-yellow-600">
              {proximoFestivo.nombre}
            </p>
          </div>
        )}

        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <h3 className="text-sm text-green-800 font-medium mb-1">
            Festivos Restantes
          </h3>
          <p className="text-lg font-bold text-green-700">
            {festivosRestantes.length}
          </p>
          <p className="text-xs text-green-600">
            en lo que queda de año
          </p>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h3 className="text-sm text-blue-800 font-medium mb-1">
            Festivos Trabajados
          </h3>
          <p className="text-lg font-bold text-blue-700">
            {festivosPasados.length}
          </p>
          <p className="text-xs text-blue-600">
            hasta la fecha
          </p>
        </div>
      </div>

      {expandido && (
        <div className="mt-6">
          {/* Selector de año */}
          <div className="mb-4 flex items-center justify-center">
            <button
              onClick={() => setAñoActual(añoActual - 1)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-l-lg"
            >
              ←
            </button>
            <span className="px-4 py-1 text-sm bg-gray-100 font-medium">
              {añoActual}
            </span>
            <button
              onClick={() => setAñoActual(añoActual + 1)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-r-lg"
            >
              →
            </button>
          </div>

          {/* Lista de festivos por categoría */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Festivos Nacionales */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                <Star className="h-4 w-4 mr-2 text-red-500" />
                Nacionales ({festivos.nacionales.length})
              </h3>
              <div className="space-y-2">
                {festivos.nacionales.map((festivo, index) => (
                  <FestivoItem key={index} festivo={festivo} />
                ))}
              </div>
            </div>

            {/* Festivos Autonómicos */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                <Gift className="h-4 w-4 mr-2 text-yellow-500" />
                Cataluña ({festivos.autonomicos.length})
              </h3>
              <div className="space-y-2">
                {festivos.autonomicos.map((festivo, index) => (
                  <FestivoItem key={index} festivo={festivo} />
                ))}
              </div>
            </div>

            {/* Festivos Variables */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                Variables ({festivos.variables.length})
              </h3>
              <div className="space-y-2">
                {festivos.variables.map((festivo, index) => (
                  <FestivoItem key={index} festivo={festivo} />
                ))}
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Información sobre días festivos
            </h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Los días festivos trabajados se marcan automáticamente en tus registros</p>
              <p>• Los festivos autonómicos son específicos de Cataluña</p>
              <p>• Los festivos variables se calculan en base a la fecha de Pascua</p>
              <p>• Trabajar en festivos puede generar compensaciones adicionales</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FestivoItem = ({ festivo }) => {
  const hoy = new Date();
  const esPasado = festivo.fecha < hoy;
  const esProximo = !esPasado && festivo.fecha <= new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);

  const getColorClases = () => {
    if (esProximo) {
      return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    } else if (esPasado) {
      return 'bg-gray-100 border-gray-300 text-gray-600';
    } else {
      return 'bg-white border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`p-2 rounded border ${getColorClases()}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-medium text-sm">
            {festivo.nombre}
          </div>
          <div className="text-xs opacity-75">
            {festivo.fecha.toLocaleDateString('es', { 
              weekday: 'short',
              day: 'numeric', 
              month: 'short' 
            })}
          </div>
        </div>
        {esProximo && (
          <Clock className="h-3 w-3 text-yellow-600 ml-2 mt-0.5" />
        )}
      </div>
    </div>
  );
};

export default InfoFestivos;
