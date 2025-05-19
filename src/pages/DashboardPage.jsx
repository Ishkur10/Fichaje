import React, { useState } from 'react';
import Header from '../components/layout/Header';
import ControlFichaje from '../components/fichaje/ControlFichaje';
import HistorialFichajes from '../components/fichaje/HistorialFichajes';
import InformeExcel from '../components/fichaje/InformeExcel';
import ResumenHoras from '../components/fichaje/ResumenHoras';
import { FileBarChart2, FileClock, FileText, ChartBar } from 'lucide-react';
import useFichaje from '../hooks/useFichaje';

const DashboardPage = () => {
  const { nombreEmpleado } = useFichaje();
  const [activeTab, setActiveTab] = useState('fichajes');
  
  const tabs = [
    {
      id: 'fichajes',
      label: 'Fichajes',
      icon: <FileClock className="h-5 w-5" />,
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas',
      icon: <ChartBar className="h-5 w-5" />,
    },
    {
      id: 'informes',
      label: 'Informes',
      icon: <FileText className="h-5 w-5" />,
    },
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Sistema de Fichajes de {nombreEmpleado ? `- ${nombreEmpleado}` : ''}
          </h1>
        </div>
        
        {/* Tabs */}
        <div className="flex flex-wrap border-b border-gray-200 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center px-4 py-3 font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        
        {activeTab === 'fichajes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ControlFichaje />
            </div>
            <div className="lg:col-span-2">
              <HistorialFichajes />
            </div>
          </div>
        )}
        
        {activeTab === 'estadisticas' && (
          <div>
            <ResumenHoras />
          </div>
        )}
        
        {activeTab === 'informes' && (
          <div className="max-w-lg mx-auto">
            <InformeExcel />
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;