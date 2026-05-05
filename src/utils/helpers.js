/**
 * Funciones helper para la aplicación tipo Rappi
 * Contiene utilidades reutilizables en toda la aplicación
 */

/**
 * Formatea un valor numérico a pesos colombianos
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada en pesos colombianos
 * @example
 * formatCurrency(25000) // Returns: "$25.000"
 */
export const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0';
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formatea una fecha a un formato legible en español
 * @param {Date|string|number} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @param {boolean} options.includeTime - Si incluir la hora (por defecto: true)
 * @param {boolean} options.short - Formato corto (por defecto: false)
 * @returns {string} Fecha formateada
 * @example
 * formatDate(new Date()) // Returns: "27 de diciembre de 2025, 10:30 AM"
 * formatDate(new Date(), { short: true }) // Returns: "27/12/2025"
 */
export const formatDate = (date, options = {}) => {
  const { includeTime = true, short = false } = options;

  if (!date) {
    return 'Fecha no disponible';
  }

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  if (short) {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  }

  const dateOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };

  if (includeTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
    dateOptions.hour12 = true;
  }

  return new Intl.DateTimeFormat('es-CO', dateOptions).format(dateObj);
};

/**
 * Formatea una fecha de forma relativa (hace 2 horas, hace 3 días, etc.)
 * @param {Date|string|number} date - Fecha a formatear
 * @returns {string} Fecha en formato relativo
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // Returns: "hace 1 hora"
 */
export const formatRelativeTime = (date) => {
  if (!date) {
    return 'Fecha no disponible';
  }

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) {
    return 'hace unos segundos';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `hace ${diffInMonths} ${diffInMonths === 1 ? 'mes' : 'meses'}`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `hace ${diffInYears} ${diffInYears === 1 ? 'año' : 'años'}`;
};

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del primer punto
 * @param {number} lon1 - Longitud del primer punto
 * @param {number} lat2 - Latitud del segundo punto
 * @param {number} lon2 - Longitud del segundo punto
 * @returns {number} Distancia en kilómetros
 * @example
 * calculateDistance(4.6097, -74.0817, 4.6533, -74.0836) // Returns: ~4.85 km
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Validar coordenadas
  if (
    typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' || typeof lon2 !== 'number'
  ) {
    console.error('Coordenadas inválidas');
    return 0;
  }

  // Radio de la Tierra en kilómetros
  const R = 6371;

  // Convertir grados a radianes
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  // Retornar distancia redondeada a 2 decimales
  return Math.round(distance * 100) / 100;
};

/**
 * Genera un número de orden único
 * Formato: YYYYMMDD-HHMMSS-RANDOM
 * @returns {string} Número de orden único
 * @example
 * generateOrderNumber() // Returns: "20251227-143025-A7B9"
 */
export const generateOrderNumber = () => {
  const now = new Date();

  // Formatear fecha y hora
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Generar código aleatorio de 4 caracteres
  const randomCode = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();

  return `${year}${month}${day}-${hours}${minutes}${seconds}-${randomCode}`;
};

/**
 * Valida un formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} True si el email es válido
 * @example
 * validateEmail("usuario@example.com") // Returns: true
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida un número de teléfono colombiano
 * @param {string} phone - Número de teléfono a validar
 * @returns {boolean} True si el teléfono es válido
 * @example
 * validatePhone("3001234567") // Returns: true
 * validatePhone("+573001234567") // Returns: true
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Remover espacios y guiones
  const cleanPhone = phone.replace(/[\s-]/g, '');

  // Validar formato colombiano: 10 dígitos o +57 seguido de 10 dígitos
  const phoneRegex = /^(\+57)?[0-9]{10}$/;
  return phoneRegex.test(cleanPhone);
};

/**
 * Calcula el tiempo estimado de entrega basado en la distancia
 * @param {number} distance - Distancia en kilómetros
 * @returns {number} Tiempo estimado en minutos
 * @example
 * calculateDeliveryTime(5) // Returns: 30
 */
export const calculateDeliveryTime = (distance) => {
  if (typeof distance !== 'number' || distance < 0) {
    return 0;
  }

  // Tiempo base de preparación: 15 minutos
  const preparationTime = 15;

  // Velocidad promedio del repartidor: 20 km/h
  const avgSpeed = 20;

  // Calcular tiempo de viaje en minutos
  const travelTime = (distance / avgSpeed) * 60;

  // Tiempo total redondeado a múltiplos de 5
  const totalTime = Math.ceil((preparationTime + travelTime) / 5) * 5;

  return totalTime;
};

/**
 * Trunca un texto a un número específico de caracteres
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @param {string} suffix - Sufijo a agregar (por defecto: "...")
 * @returns {string} Texto truncado
 * @example
 * truncateText("Este es un texto muy largo", 10) // Returns: "Este es un..."
 */
export const truncateText = (text, maxLength, suffix = '...') => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} text - Texto a capitalizar
 * @returns {string} Texto capitalizado
 * @example
 * capitalizeWords("hola mundo") // Returns: "Hola Mundo"
 */
export const capitalizeWords = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Genera una clave única basada en timestamp y random
 * @param {string} prefix - Prefijo opcional para la clave
 * @returns {string} Clave única
 * @example
 * generateUniqueKey("item") // Returns: "item_1703689825123_a7b9"
 */
export const generateUniqueKey = (prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};

/**
 * Debounce function para optimizar búsquedas y inputs
 * @param {Function} func - Función a ejecutar
 * @param {number} delay - Delay en milisegundos
 * @returns {Function} Función con debounce
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

/**
 * Calcula el porcentaje de descuento
 * @param {number} originalPrice - Precio original
 * @param {number} discountedPrice - Precio con descuento
 * @returns {number} Porcentaje de descuento
 * @example
 * calculateDiscountPercentage(100000, 80000) // Returns: 20
 */
export const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
  if (
    typeof originalPrice !== 'number' ||
    typeof discountedPrice !== 'number' ||
    originalPrice <= 0
  ) {
    return 0;
  }

  const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(discount);
};
