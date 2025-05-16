import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ControlFichaje from '../components/fichaje/ControlFichaje';
import HistorialFichajes from '../components/fichaje/HistorialFichajes';
import InformeExcel from '../components/fichaje/InformeExcel';
import { FileBarChart2, FileClock } from 'lucide-react';
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
      id: 'informes',
      label: 'Informes',
      icon: <FileBarChart2 className="h-5 w-5" />,
    },
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="bg-red-500 p-10 text-white text-3xl">
    Probando Tailwind CSS
  </div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Sistema de Fichajes {nombreEmpleado ? `- ${nombreEmpleado}` : ''}
          </h1>
          <p className="text-gray-600">
            Gestiona tus fichajes y genera informes fácilmente
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
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
        
        {/* Contenido según la pestaña activa */}
        {activeTab === 'fichajes' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ControlFichaje />
            </div>
            <div className="lg:col-span-2">
              <HistorialFichajes />
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto">
            <InformeExcel />
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default DashboardPage;