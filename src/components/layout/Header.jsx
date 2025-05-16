import React from 'react';
import { Clock } from 'lucide-react';
import useFichaje from '../../hooks/useFichaje';

const Header = () => {
  const { nombreEmpleado } = useFichaje();

  return (
    <header className="bg-white shadow-md py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Clock className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-xl font-bold text-blue-700">Sistema de Fichajes</h1>
        </div>

        {nombreEmpleado && (
          <div className="flex items-center">
            <div className="flex items-center">
              <span className="text-gray-700 font-medium">{nombreEmpleado}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;