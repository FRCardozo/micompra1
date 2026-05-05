/**
 * Constantes de la aplicación tipo Rappi
 * Contiene todos los valores constantes utilizados en la aplicación
 */

/**
 * Estados de las órdenes con sus etiquetas en español
 */
export const ORDER_STATUS = {
  PENDING: {
    value: 'pending',
    label: 'Pendiente',
    color: '#FFA500',
    description: 'La orden ha sido creada y está esperando confirmación',
  },
  CONFIRMED: {
    value: 'confirmed',
    label: 'Confirmada',
    color: '#4169E1',
    description: 'La orden ha sido confirmada por el establecimiento',
  },
  PREPARING: {
    value: 'preparing',
    label: 'En preparación',
    color: '#9370DB',
    description: 'El establecimiento está preparando la orden',
  },
  READY: {
    value: 'ready',
    label: 'Lista para recoger',
    color: '#20B2AA',
    description: 'La orden está lista y esperando al repartidor',
  },
  IN_DELIVERY: {
    value: 'in_delivery',
    label: 'En camino',
    color: '#32CD32',
    description: 'El repartidor está en camino con la orden',
  },
  DELIVERED: {
    value: 'delivered',
    label: 'Entregada',
    color: '#228B22',
    description: 'La orden ha sido entregada exitosamente',
  },
  CANCELLED: {
    value: 'cancelled',
    label: 'Cancelada',
    color: '#DC143C',
    description: 'La orden ha sido cancelada',
  },
  REJECTED: {
    value: 'rejected',
    label: 'Rechazada',
    color: '#8B0000',
    description: 'La orden ha sido rechazada por el establecimiento',
  },
};

/**
 * Métodos de pago disponibles
 */
export const PAYMENT_METHODS = {
  CASH: {
    value: 'cash',
    label: 'Efectivo',
    icon: '💵',
    description: 'Pago en efectivo al recibir',
  },
  CARD: {
    value: 'card',
    label: 'Tarjeta de crédito/débito',
    icon: '💳',
    description: 'Pago con tarjeta',
  },
  PSE: {
    value: 'pse',
    label: 'PSE',
    icon: '🏦',
    description: 'Pago a través de PSE',
  },
  NEQUI: {
    value: 'nequi',
    label: 'Nequi',
    icon: '📱',
    description: 'Pago con Nequi',
  },
  DAVIPLATA: {
    value: 'daviplata',
    label: 'Daviplata',
    icon: '📲',
    description: 'Pago con Daviplata',
  },
  WALLET: {
    value: 'wallet',
    label: 'Billetera digital',
    icon: '👛',
    description: 'Pago con saldo de billetera',
  },
};

/**
 * Estados del repartidor
 */
export const DELIVERY_DRIVER_STATUS = {
  AVAILABLE: {
    value: 'available',
    label: 'Disponible',
    color: '#00C851',
    description: 'El repartidor está disponible para recibir órdenes',
  },
  BUSY: {
    value: 'busy',
    label: 'Ocupado',
    color: '#FFA500',
    description: 'El repartidor está realizando una entrega',
  },
  OFFLINE: {
    value: 'offline',
    label: 'Desconectado',
    color: '#6C757D',
    description: 'El repartidor no está disponible',
  },
  ON_BREAK: {
    value: 'on_break',
    label: 'En descanso',
    color: '#17A2B8',
    description: 'El repartidor está en descanso',
  },
};

/**
 * Estados de los establecimientos
 */
export const STORE_STATUS = {
  OPEN: {
    value: 'open',
    label: 'Abierto',
    color: '#00C851',
    icon: '🟢',
    description: 'El establecimiento está abierto y recibiendo órdenes',
  },
  CLOSED: {
    value: 'closed',
    label: 'Cerrado',
    color: '#DC143C',
    icon: '🔴',
    description: 'El establecimiento está cerrado',
  },
  BUSY: {
    value: 'busy',
    label: 'Ocupado',
    color: '#FFA500',
    icon: '🟡',
    description: 'El establecimiento está muy ocupado',
  },
  PAUSED: {
    value: 'paused',
    label: 'Pausado',
    color: '#6C757D',
    icon: '⏸️',
    description: 'El establecimiento ha pausado temporalmente las órdenes',
  },
};

/**
 * Roles de usuarios en el sistema
 */
export const USER_ROLES = {
  CUSTOMER: {
    value: 'customer',
    label: 'Cliente',
    description: 'Usuario que realiza pedidos',
  },
  DRIVER: {
    value: 'driver',
    label: 'Repartidor',
    description: 'Usuario que entrega los pedidos',
  },
  STORE_OWNER: {
    value: 'store_owner',
    label: 'Dueño de establecimiento',
    description: 'Usuario que gestiona un establecimiento',
  },
  ADMIN: {
    value: 'admin',
    label: 'Administrador',
    description: 'Usuario con acceso completo al sistema',
  },
};

/**
 * Formateador de moneda para pesos colombianos
 */
export const COLOMBIAN_PESO = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Configuración de la aplicación
 */
export const APP_CONFIG = {
  APP_NAME: 'Rappi Clone',
  CURRENCY: 'COP',
  COUNTRY: 'Colombia',
  MIN_ORDER_AMOUNT: 10000, // Monto mínimo de orden en COP
  DELIVERY_FEE: 5000, // Tarifa de domicilio en COP
  FREE_DELIVERY_THRESHOLD: 50000, // Monto para domicilio gratis en COP
  MAX_DELIVERY_DISTANCE: 10, // Distancia máxima de entrega en km
  ORDER_TIMEOUT: 30, // Tiempo en minutos para cancelar una orden automáticamente
};

/**
 * Categorías de productos
 */
export const PRODUCT_CATEGORIES = {
  FOOD: {
    value: 'food',
    label: 'Comida',
    icon: '🍔',
  },
  DRINKS: {
    value: 'drinks',
    label: 'Bebidas',
    icon: '🥤',
  },
  GROCERIES: {
    value: 'groceries',
    label: 'Mercado',
    icon: '🛒',
  },
  PHARMACY: {
    value: 'pharmacy',
    label: 'Farmacia',
    icon: '💊',
  },
  BAKERY: {
    value: 'bakery',
    label: 'Panadería',
    icon: '🥖',
  },
  DESSERTS: {
    value: 'desserts',
    label: 'Postres',
    icon: '🍰',
  },
  FAST_FOOD: {
    value: 'fast_food',
    label: 'Comida rápida',
    icon: '🍕',
  },
  HEALTHY: {
    value: 'healthy',
    label: 'Saludable',
    icon: '🥗',
  },
};

/**
 * Tiempos estimados de entrega
 */
export const DELIVERY_TIME = {
  EXPRESS: {
    value: 'express',
    label: 'Express',
    minutes: 20,
    description: 'Entrega en 15-25 minutos',
  },
  STANDARD: {
    value: 'standard',
    label: 'Estándar',
    minutes: 40,
    description: 'Entrega en 30-50 minutos',
  },
  SCHEDULED: {
    value: 'scheduled',
    label: 'Programada',
    minutes: null,
    description: 'Entrega en la hora seleccionada',
  },
};

/**
 * Regex y validaciones
 */
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^(\+57)?[0-9]{10}$/,
  PASSWORD_MIN_LENGTH: 8,
};
