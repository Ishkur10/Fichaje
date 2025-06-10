import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Award, 
  TrendingUp, 
  Gift, 
  Settings,
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';
import { getTipoDisplayName } from '../../utils/diasEspecialesUtils';

const ResumenDashboard = () => {
  const { 
    fichajes, 
    sesionActiva, 
    nombreEmpleado,
    getEstadisticasExtendidas,
    getResumenHorasExtras,
    getDiasEspeciales,
    verificarFestivo
  } = useFichaje();
  
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (nombreEmpleado) {
      calcularResumen();
    } else {
      setLoading(false);
    }
  }, [fichajes, sesionActiva, nombreEmpleado]);

  const calcularResumen = () => {
    try {
      setLoading(true);
      
      // Calcular estadísticas del mes actual
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Calcular estadísticas de la semana actual
      const inicioSemana = new Date(hoy);
      const dia = inicioSemana.getDay();
      const diferencia = dia === 0 ? -6 : 1 - dia;
      inicioSemana.setDate(hoy.getDate() + diferencia);
      inicioSemana.setHours(0, 0, 0, 0);
      
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + 6);
      finSemana.setHours(23, 59, 59, 999);
      
      // Obtener estadísticas
      const estadisticasMes = getEstadisticasExtendidas(inicioMes, finMes);
      const horasExtrasMes = getResumenHorasExtras(inicioMes, finMes);
      const horasExtrasSemana = getResumenHorasExtras(inicioSemana, finSemana);
      
      // Obtener días especiales del mes
      const diasEspeciales = getDiasEspeciales()
        .filter(dia => {
          const fechaDia = new Date(dia.fechaCompleta);
          return dia.empleado === nombreEmpleado && 
                 dia.activo &&
                 fechaDia >= inicioMes && 
                 fechaDia <= finMes;
        });
      
      // Verificar si hoy es festivo
      const infoFestivoHoy = verificarFestivo(hoy);
      
      setResumen({
        mesActual: {
          diasTrabajados: estadisticasMes?.diasTotalesConEspeciales || 0,
          horasTrabajadas: estadisticasMes?.horasTotalesConEspeciales || 0,
          diasFestivos: estadisticasMes?.diasFestivosTrabajados || 0,
          diasEspeciales: diasEspeciales.length,
          eficiencia: estadisticasMes?.eficiencia || 0
        },
        horasExtras: {
          mesActual: horasExtrasMes?.horasExtrasTotal || 0,
          semanaActual: horasExtrasSemana?.horasExtrasTotal || 0,
          semanasConExtras: horasExtrasMes?.semanas?.filter(s => s.horasExtras > 0).length || 0
        },
        diasEspeciales: {
          total: diasEspeciales.length,
          porTipo: diasEspeciales.reduce((acc, dia) => {
            acc[dia.tipo] = (acc[dia.tipo] || 0) + 1;
            return acc;
          }, {}),
          horasTotal: diasEspeciales.reduce((total, dia) => total + dia.horas, 0)
        },
        hoy: {
          esFestivo: infoFestivoHoy.esFestivo,
          nombreFestivo: infoFestivoHoy.nombre,
          sesionActiva: !!sesionActiva
        }
      });
      
    } catch (error) {
      console.error('Error al calcular resumen:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!nombreEmpleado) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Bienvenido al Sistema de Fichajes</p>
          <p className="text-sm">
            Guarda tu nombre en el control de fichaje para comenzar a usar todas las funcionalidades
          </p>
        </div>
      </div>
    );
  }

  if (loading || !resumen) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando resumen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          ¡Hola, {nombreEmpleado}! 👋
        </h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{new Date().toLocaleDateString('es', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}</span>
          </div>
          
          {resumen.hoy.esFestivo && (
            <div className="flex items-center text-yellow-600">
              <Gift className="h-4 w-4 mr-1" />
              <span>{resumen.hoy.nombreFestivo}</span>
            </div>
          )}
          
          {resumen.hoy.sesionActiva && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>Sesión activa</span>
            </div>
          )}
        </div>
      </div>

      {/* Resumen principal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-blue-800 font-medium">Mes Actual</h3>
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {resumen.mesActual.diasTrabajados}
          </p>
          <p className="text-xs text-blue-600">
            días trabajados
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {resumen.mesActual.horasTrabajadas}h totales
          </p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-yellow-800 font-medium">Horas Extras</h3>
            <Award className="h-4 w-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-700">
            {resumen.horasExtras.mesActual.toFixed(1)}h
          </p>
          <p className="text-xs text-yellow-600">
            este mes
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            {resumen.horasExtras.semanaActual.toFixed(1)}h esta semana
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-green-800 font-medium">Eficiencia</h3>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700">
            {resumen.mesActual.eficiencia.toFixed(0)}%
          </p>
          <p className="text-xs text-green-600">
            vs horas teóricas
          </p>
          <p className="text-xs text-green-600 mt-1">
            {resumen.mesActual.diasFestivos} festivos trabajados
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-purple-800 font-medium">Días Especiales</h3>
            <Settings className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {resumen.diasEspeciales.total}
          </p>
          <p className="text-xs text-purple-600">
            este mes
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {resumen.diasEspeciales.horasTotal}h registradas
          </p>
        </div>
      </div>

      {/* Detalles adicionales */}
      {(resumen.horasExtras.semanasConExtras > 0 || resumen.diasEspeciales.total > 0) && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Resumen adicional</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            {resumen.horasExtras.semanasConExtras > 0 && (
              <div className="flex items-center text-yellow-600">
                <Award className="h-4 w-4 mr-1" />
                <span>
                  {resumen.horasExtras.semanasConExtras} semana{resumen.horasExtras.semanasConExtras > 1 ? 's' : ''} con horas extras
                </span>
              </div>
            )}
            
            {Object.entries(resumen.diasEspeciales.porTipo).map(([tipo, cantidad]) => (
              <div key={tipo} className="flex items-center text-gray-600">
                <Settings className="h-4 w-4 mr-1" />
                <span>
                  {cantidad} {getTipoDisplayName(tipo).toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumenDashboard;