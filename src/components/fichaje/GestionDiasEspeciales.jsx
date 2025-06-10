import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Trash2, 
  Eye, 
  EyeOff, 
  Gift, 
  Heart, 
  Stethoscope, 
  ChevronDown, 
  ChevronUp,
  Clock,
  User,
  AlertTriangle
} from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';
import Button from '../ui/Button';
import { 
  getTipoDisplayName,
  getTipoColorClasses,
  TIPOS_DIA_ESPECIAL
} from '../../utils/diasEspecialesUtils';

const GestionDiasEspeciales = () => {
  const { getDiasEspeciales, eliminarDiaEspecial, nombreEmpleado } = useFichaje();
  const [diasEspeciales, setDiasEspeciales] = useState([]);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    cargarDiasEspeciales();
  }, []);

  const cargarDiasEspeciales = () => {
    const dias = getDiasEspeciales();
    // Filtrar por empleado actual y ordenar por fecha
    const diasFiltrados = dias
      .filter(dia => dia.empleado === nombreEmpleado && dia.activo)
      .sort((a, b) => new Date(b.fechaCompleta) - new Date(a.fechaCompleta));
    
    setDiasEspeciales(diasFiltrados);
  };

  const handleEliminar = async (diaEspecialId) => {
    if (window.confirm('¿Estás seguro de eliminar este día especial?')) {
      const resultado = eliminarDiaEspecial(diaEspecialId);
      
      if (resultado.success) {
        cargarDiasEspeciales();
      } else {
        alert('Error al eliminar el día especial: ' + resultado.message);
      }
    }
  };

  const diasFiltrados = diasEspeciales.filter(dia => {
    if (filtroTipo === 'todos') return true;
    return dia.tipo === filtroTipo;
  });

  const diasMostrar = mostrarTodos ? diasFiltrados : diasFiltrados.slice(0, 5);

  const estadisticas = {
    total: diasEspeciales.length,
    totalHoras: diasEspeciales.reduce((total, dia) => total + dia.horas, 0),
    porTipo: {
      [TIPOS_DIA_ESPECIAL.FESTIVO_MANUAL]: diasEspeciales.filter(d => d.tipo === TIPOS_DIA_ESPECIAL.FESTIVO_MANUAL).length,
      [TIPOS_DIA_ESPECIAL.FIESTA_PERSONAL]: diasEspeciales.filter(d => d.tipo === TIPOS_DIA_ESPECIAL.FIESTA_PERSONAL).length,
      [TIPOS_DIA_ESPECIAL.BAJA_LABORAL]: diasEspeciales.filter(d => d.tipo === TIPOS_DIA_ESPECIAL.BAJA_LABORAL).length
    }
  };

  if (!nombreEmpleado) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Días Especiales Registrados
          </h2>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Empleado no identificado</p>
          <p className="text-sm">Guarda tu nombre en el control de fichaje para ver tus días especiales</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpandido(!expandido)}
      >
        <h2 className="text-xl font-semibold flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Días Especiales Registrados
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {estadisticas.total} registro{estadisticas.total !== 1 ? 's' : ''}
          </span>
          {expandido ? 
            <ChevronUp className="h-5 w-5 text-gray-500" /> : 
            <ChevronDown className="h-5 w-5 text-gray-500" />
          }
        </div>
      </div>

      {expandido && (
        <div className="mt-6">
          {/* Estadísticas resumidas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm text-blue-800 font-medium mb-1">Total Registros</h3>
              <p className="text-2xl font-bold text-blue-700">{estadisticas.total}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm text-green-800 font-medium mb-1">Horas Totales</h3>
              <p className="text-2xl font-bold text-green-700">{estadisticas.totalHoras}h</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm text-yellow-800 font-medium mb-1">Días Festivos</h3>
              <p className="text-2xl font-bold text-yellow-700">
                {estadisticas.porTipo[TIPOS_DIA_ESPECIAL.FESTIVO_MANUAL]}
              </p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm text-red-800 font-medium mb-1">Bajas Laborales</h3>
              <p className="text-2xl font-bold text-red-700">
                {estadisticas.porTipo[TIPOS_DIA_ESPECIAL.BAJA_LABORAL]}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                filtroTipo === 'todos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos ({estadisticas.total})
            </button>
            
            {Object.values(TIPOS_DIA_ESPECIAL).map(tipo => {
              const cantidad = estadisticas.porTipo[tipo] || 0;
              if (cantidad === 0) return null;
              
              return (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    filtroTipo === tipo
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {getTipoDisplayName(tipo)} ({cantidad})
                </button>
              );
            })}
          </div>

          {/* Lista de días especiales */}
          {diasMostrar.length > 0 ? (
            <div className="space-y-3">
              {diasMostrar.map((dia) => (
                <DiaEspecialCard 
                  key={dia.id} 
                  dia={dia} 
                  onEliminar={handleEliminar}
                />
              ))}
              
              {/* Botón mostrar más/menos */}
              {diasFiltrados.length > 5 && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => setMostrarTodos(!mostrarTodos)}
                    variant="secondary"
                    icon={mostrarTodos ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    className="text-sm"
                  >
                    {mostrarTodos 
                      ? `Mostrar menos` 
                      : `Mostrar ${diasFiltrados.length - 5} más`
                    }
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">
                {filtroTipo === 'todos' 
                  ? 'No hay días especiales registrados' 
                  : `No hay registros de ${getTipoDisplayName(filtroTipo).toLowerCase()}`
                }
              </p>
              <p className="text-sm">
                Los días especiales registrados aparecerán aquí
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DiaEspecialCard = ({ dia, onEliminar }) => {
  const colorClasses = getTipoColorClasses(dia.tipo);
  const fechaObj = new Date(dia.fechaCompleta);
  const esReciente = (new Date() - fechaObj) / (1000 * 60 * 60 * 24) <= 7; // Últimos 7 días
  
  const getIcono = (tipo) => {
    switch (tipo) {
      case TIPOS_DIA_ESPECIAL.FESTIVO_MANUAL:
        return <Gift className="h-5 w-5" />;
      case TIPOS_DIA_ESPECIAL.FIESTA_PERSONAL:
        return <Heart className="h-5 w-5" />;
      case TIPOS_DIA_ESPECIAL.BAJA_LABORAL:
        return <Stethoscope className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${colorClasses.border} ${colorClasses.bg}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`${colorClasses.text} mt-1`}>
            {getIcono(dia.tipo)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className={`font-medium ${colorClasses.text}`}>
                {getTipoDisplayName(dia.tipo)}
              </h3>
              {esReciente && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Reciente
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {fechaObj.toLocaleDateString('es', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>{dia.horas} horas registradas</span>
              </div>
              
              {dia.motivo && (
                <div className="mt-2">
                  <span className="font-medium">Motivo:</span> {dia.motivo}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <Button
            onClick={() => onEliminar(dia.id)}
            variant="danger"
            size="sm"
            icon={<Trash2 className="h-4 w-4" />}
            className="text-xs"
          >
            Eliminar
          </Button>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <User className="h-3 w-3 mr-1" />
            <span>Registrado por {dia.empleado}</span>
          </div>
          <span>
            {new Date(dia.fechaRegistro).toLocaleDateString('es', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GestionDiasEspeciales;