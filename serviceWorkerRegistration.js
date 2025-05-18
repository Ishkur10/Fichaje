// src/serviceWorkerRegistration.js

// Este archivo manejará el registro del Service Worker
// y la comunicación con él

// Variable para almacenar la referencia al Service Worker
let swRegistration = null;

// Función para registrar el Service Worker
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      
      navigator.serviceWorker
        .register(swUrl)
        .then(registration => {
          swRegistration = registration;
          
          console.log('Service Worker registrado con éxito');
          
          // Comprobar si hay actualizaciones
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('Nuevo contenido disponible');
                } else {
                  console.log('Contenido cacheado para uso offline');
                }
              }
            };
          };
        })
        .catch(error => {
          console.error('Error al registrar el Service Worker:', error);
        });
    });
  }
}

// Función para iniciar un temporizador en el Service Worker
export function startTimerInSW(sessionId, startTime, accumulatedTime, isPaused) {
  if (!swRegistration) {
    console.error('Service Worker no registrado');
    return;
  }
  
  swRegistration.active.postMessage({
    type: 'INIT_TIMER',
    sessionId,
    startTime,
    accumulatedTime,
    isPaused
  });
}

// Función para detener un temporizador en el Service Worker
export function stopTimerInSW() {
  if (!swRegistration) {
    console.error('Service Worker no registrado');
    return;
  }
  
  swRegistration.active.postMessage({
    type: 'STOP_TIMER'
  });
}

// Función para pausar o reanudar un temporizador en el Service Worker
export function togglePauseTimerInSW(isPaused) {
  if (!swRegistration) {
    console.error('Service Worker no registrado');
    return;
  }
  
  swRegistration.active.postMessage({
    type: 'TOGGLE_PAUSE',
    isPaused
  });
}

// Función para solicitar permiso para notificaciones
export function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return Promise.resolve(false);
  }
  
  return Notification.requestPermission()
    .then(permission => {
      if (permission === 'granted') {
        console.log('Permiso de notificaciones concedido');
        return true;
      } else {
        console.log('Permiso de notificaciones denegado');
        return false;
      }
    });
}

// Función para desuscribirse
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}