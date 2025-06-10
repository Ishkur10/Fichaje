import React, { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Trash2, Edit2, MoreVertical, Gift, Star } from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';
import { formatearFecha, formatearHora } from '../../utils/dateUtils';
import EditarFichajeModal from './EditarFichajeModal';

const HistorialFichajes = () => {
  const { fichajes, eliminarFichaje, verificarFestivo } = useFichaje();
  const [paginaActual, setPaginaActual] = useState(1);
  const [fichajeParaEditar, setFichajeParaEditar] = useState(null);
  const [fichajeMenuAbierto, setFichajeMenuAbierto] = useState(null);
  const [fichajesOrdenados, setFichajesOrdenados] = useState([]);
  const fichajesPorPagina = 8;
  
  useEffect(() => {
    const ordenados = [...fichajes].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );
    
    // Añadir información de festivos a cada fichaje
    const fichajesConInfo = ordenados.map(fichaje => {
      const fechaFichaje = new Date(fichaje.fecha);
      const infoFestivo = verificarFestivo(fechaFichaje);
      
      return {
        ...fichaje,
        esFestivo: infoFestivo.esFestivo,
        tipoFestivo: infoFestivo.tipo,
        nombreFestivo: infoFestivo.nombre
      };
    });
    
    console.log('Fichajes actualizados en el historial:', fichajesConInfo.length);
    setFichajesOrdenados(fichajesConInfo);
  }, [fichajes, verificarFestivo]);
  
  const totalPaginas = Math.ceil(fichajesOrdenados.length / fichajesPorPagina);
  const indiceInicio = (paginaActual - 1) * fichajesPorPagina;
  const fichajesToShow = fichajesOrdenados.slice(
    indiceInicio, 
    indiceInicio + fichajesPorPagina
  );
  
  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) {
      setPaginaActual(totalPaginas);
    }
  }, [totalPaginas, paginaActual]);
  
  const handlePageChange = (page) => {
    setPaginaActual(page);
    setFichajeMenuAbierto(null);
  };
  
  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar este fichaje?')) {
      eliminarFichaje(id);
      setFichajeMenuAbierto(null);
    }
  };
  
  const handleEdit = (fichaje) => {
    setFichajeParaEditar(fichaje);
    setFichajeMenuAbierto(null);
  };
  
  const handleCloseModal = () => {
    setFichajeParaEditar(null);
  };

  const toggleMenu = (id) => {
    setFichajeMenuAbierto(fichajeMenuAbierto === id ? null : id);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <CalendarDays className="h-5 w-5 mr-2" /> Historial de Fichajes
      </h2>
      
      {fichajesToShow.length > 0 ? (
        <>
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
              <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Observaciones
              </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Acciones
                    </th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fichajesToShow.map((fichaje) => (
                  <tr key={fichaje.id} className={`hover:bg-gray-50 ${
                    fichaje.esFestivo ? 'bg-yellow-50' : ''
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {fichaje.esFestivo && (
                          <Gift className="h-4 w-4 mr-2 text-yellow-500" title={fichaje.nombreFestivo} />
                        )}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          fichaje.tipo === 'entrada' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {fichaje.tipo === 'entrada' ? '🟢 Entrada' : '🔴 Salida'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatearFecha(fichaje.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatearHora(fichaje.fecha)}
                      {fichaje.tipo === 'salida' && fichaje.tiempoFormateado && (
                        <div className="text-xs text-gray-500 mt-1">
                          ⏱️ {fichaje.tiempoFormateado}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {fichaje.esFestivo && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" /> {fichaje.nombreFestivo}
                        </span>
                      )}
                      {fichaje.pausada && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 ml-1">
                          ⏸️ Con pausas
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(fichaje)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar fichaje"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(fichaje.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar fichaje"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3 mt-4">
            {fichajesToShow.map((fichaje) => (
              <div key={fichaje.id} className={`border border-gray-200 rounded-lg shadow-sm overflow-hidden relative ${
                fichaje.esFestivo ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
              }`}>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      {fichaje.esFestivo && (
                        <Gift className="h-4 w-4 mr-2 text-yellow-500" />
                      )}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        fichaje.tipo === 'entrada' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {fichaje.tipo === 'entrada' ? '🟢 Entrada' : '🔴 Salida'}
                      </span>
                    </div>
                    
                    <div className="relative">
                      <button 
                        onClick={() => toggleMenu(fichaje.id)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        <MoreVertical className="h-6 w-6" />
                      </button>
                      
                      {fichajeMenuAbierto === fichaje.id && (
                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={() => handleEdit(fichaje)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Edit2 className="h-4 w-4 mr-2" /> Editar
                            </button>
                            <button
                              onClick={() => handleDelete(fichaje.id)}
                              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Fecha</p>
                      <p className="text-sm text-gray-700">{formatearFecha(fichaje.fecha)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Hora</p>
                      <p className="text-sm text-gray-700">{formatearHora(fichaje.fecha)}</p>
                      {fichaje.tipo === 'salida' && fichaje.tiempoFormateado && (
                        <p className="text-xs text-gray-500">⏱️ {fichaje.tiempoFormateado}</p>
                      )}
                    </div>
                  </div>
                  
                  {(fichaje.esFestivo || fichaje.pausada) && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {fichaje.esFestivo && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" /> {fichaje.nombreFestivo}
                        </span>
                      )}
                      {fichaje.pausada && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          ⏸️ Con pausas
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {totalPaginas > 1 && (
            <div className="flex justify-center items-center mt-4 gap-2">
              <button
                onClick={() => handlePageChange(paginaActual - 1)}
                disabled={paginaActual === 1}
                className={`p-2 rounded ${
                  paginaActual === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-600 hover:bg-blue-100'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="hidden md:flex">
                {[...Array(totalPaginas)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-3 py-1 rounded ${
                      paginaActual === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <div className="md:hidden flex items-center">
                <span className="text-sm text-gray-600">
                  {paginaActual} de {totalPaginas}
                </span>
              </div>
              
              <button
                onClick={() => handlePageChange(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className={`p-2 rounded ${
                  paginaActual === totalPaginas
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:bg-blue-100'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No hay fichajes registrados
        </div>
      )}
      {fichajeParaEditar && (
        <EditarFichajeModal
          fichaje={fichajeParaEditar}
          onClose={handleCloseModal}/>
      )}
    </div>
  );
};

export default HistorialFichajes;