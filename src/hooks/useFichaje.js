import { useContext } from 'react';
import { FichajeContext } from '../context/FichajeContext';

export default function useFichaje() {
  return useContext(FichajeContext);
}