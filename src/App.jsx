import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { FichajeProvider } from './context/FichajeContext';
import AppRoutes from './routes';

function App() {
  return (
    <BrowserRouter>
      <FichajeProvider>
        <AppRoutes />
      </FichajeProvider>
    </BrowserRouter>
  );
}

export default App;