// public/service-worker.js

// Nombre de la caché
const CACHE_NAME = 'fichaje-app-v1';

// Archivos a cachear
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico'
];

// Variable para almacenar el intervalo de notificación
let notificationInterval = null;

// Variable para almacenar el tiempo restante para la siguiente notificación
let timeUntilNextNotification = 0;

// Instalar el Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar el Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar las peticiones de red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devolver la respuesta cacheada si existe
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Escuchar mensajes de la aplicación
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_TIMER') {
    // Iniciar temporizador para sesión activa
    startTimer(event.data.sessionId, event.data.startTime, event.data.accumulatedTime, event.data.isPaused);
  } else if (event.data && event.data.type === 'STOP_TIMER') {
    // Detener temporizador
    stopTimer();
  } else if (event.data && event.data.type === 'TOGGLE_PAUSE') {
    // Pausar o reanudar temporizador
    togglePauseTimer(event.data.isPaused);
  }
});

// Función para iniciar el temporizador
function startTimer(sessionId, startTime, accumulatedTime, isPaused) {
  // Detener el temporizador anterior si existe
  stopTimer();
  
  // Si está pausado, no iniciamos el intervalo
  if (isPaused) {
    return;
  }
  
  // Guardamos los datos de la sesión para posibles notificaciones
  self.sessionData = {
    id: sessionId,
    startTime: startTime,
    accumulatedTime: accumulatedTime || 0,
    isPaused: isPaused || false,
    lastUpdate: Date.now()
  };
  
  // Configurar intervalo para enviar notificaciones periódicas
  // Por ejemplo, cada hora de trabajo
  const NOTIFICATION_INTERVAL = 60 * 60 * 1000; // 1 hora en milisegundos
  
  notificationInterval = setInterval(() => {
    // Si la sesión está pausada, no enviamos notificaciones
    if (self.sessionData.isPaused) {
      return;
    }
    
    // Calcular tiempo transcurrido
    const now = Date.now();
    const elapsedTime = (now - self.sessionData.lastUpdate) / 1000;
    const totalSeconds = self.sessionData.accumulatedTime + elapsedTime;
    
    // Convertir a formato hh:mm:ss
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    const timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Enviar notificación
    self.registration.showNotification('Fichaje Activo', {
      body: `Tiempo trabajado: ${timeFormatted}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'tiempo-trabajado'
    });
    
    // Actualizar la marca de tiempo
    self.sessionData.lastUpdate = now;
    self.sessionData.accumulatedTime = totalSeconds;
  }, NOTIFICATION_INTERVAL);
}

// Función para detener el temporizador
function stopTimer() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
  
  self.sessionData = null;
}

// Función para pausar o reanudar el temporizador
function togglePauseTimer(isPaused) {
  if (!self.sessionData) {
    return;
  }
  
  // Actualizar el estado de pausa
  self.sessionData.isPaused = isPaused;
  
  // Si se pausa, guardar el tiempo acumulado hasta ahora
  if (isPaused) {
    const now = Date.now();
    const elapsedTime = (now - self.sessionData.lastUpdate) / 1000;
    self.sessionData.accumulatedTime += elapsedTime;
    
    // Detener el intervalo
    if (notificationInterval) {
      clearInterval(notificationInterval);
      notificationInterval = null;
    }
  } else {
    // Si se reanuda, actualizar la marca de tiempo y reiniciar el intervalo
    self.sessionData.lastUpdate = Date.now();
    
    // Reiniciar intervalo de notificación
    const NOTIFICATION_INTERVAL = 60 * 60 * 1000; // 1 hora en milisegundos
    
    notificationInterval = setInterval(() => {
      // Lógica de notificación (igual que en startTimer)
      if (self.sessionData.isPaused) {
        return;
      }
      
      const now = Date.now();
      const elapsedTime = (now - self.sessionData.lastUpdate) / 1000;
      const totalSeconds = self.sessionData.accumulatedTime + elapsedTime;
      
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      
      const timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      self.registration.showNotification('Fichaje Activo', {
        body: `Tiempo trabajado: ${timeFormatted}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'tiempo-trabajado'
      });
      
      self.sessionData.lastUpdate = now;
      self.sessionData.accumulatedTime = totalSeconds;
    }, NOTIFICATION_INTERVAL);
  }
}