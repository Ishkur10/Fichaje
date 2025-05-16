import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFoundPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            404
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Página no encontrada
          </h2>
          
          <p className="text-gray-600 mb-8">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
          
          <Button
            onClick={() => navigate('/')}
            variant="primary"
            icon={<Home className="h-5 w-5" />}
          >
            Volver al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;