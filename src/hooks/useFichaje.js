import { useContext } from 'react';
import { FichajeContext } from '../context/FichajeContext';

// Hook personalizado para acceder al contexto de fichajes
export default function useFichaje() {
  return useContext(FichajeContext);
}