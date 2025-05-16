import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center text-sm text-gray-600">
          <p>© {currentYear} Sistema de Fichajes - Versión 2.0</p>
          <p className="mt-1">Desarrollado para gestión de tiempo laboral</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;