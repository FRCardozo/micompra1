/**
 * Helper functions for coverage zone validation
 */

/**
 * Check if a point is inside a polygon using ray-casting algorithm
 * @param {Object} point - {lat, lng}
 * @param {Array} polygon - Array of {lat, lng} points
 * @returns {boolean}
 */
export function isPointInPolygon(point, polygon) {
  if (!point || !polygon || polygon.length < 3) return false;

  const { lat, lng } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Check if a zone is currently operating (based on operating hours)
 * @param {Object} zone - Coverage zone
 * @returns {boolean}
 */
export function isZoneOperating(zone) {
  if (!zone || !zone.operating_hours) return true;

  const now = new Date();
  const dayName = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday'
  ][now.getDay()];

  const schedule = zone.operating_hours[dayName];
  
  // Si el día está marcado como inactivo explícitamente en la base de datos
  if (schedule && schedule.active === false) return false;
  
  // Si no hay horario de apertura o cierre definido, asumimos que está abierto (failsafe)
  if (!schedule || !schedule.open || !schedule.close) return true;

  // Formato HH:MM
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  return currentTime >= schedule.open && currentTime <= schedule.close;
}

/**
 * Find coverage zone for a given point (Solo validación espacial)
 * @param {Object} point - {lat, lng}
 * @param {Array} zones - Array of coverage zones
 * @returns {Object|null} - Matching zone or null
 */
export function findCoverageZone(point, zones) {
  if (!point || !zones || zones.length === 0) return null;

  // Filter active zones only
  const activeZones = zones.filter(zone => zone.is_active);

  // Sort by priority (highest first para manejar zonas superpuestas)
  const sortedZones = activeZones.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // Find first matching zone
  for (const zone of sortedZones) {
    if (zone.polygon && zone.polygon.length >= 3) {
      if (isPointInPolygon(point, zone.polygon)) {
        return zone;
      }
    }
  }

  return null;
}

/**
 * Validate if service is available at a location (Validación Completa: Espacio + Tiempo)
 * @param {Object} point - {lat, lng}
 * @param {Array} zones - Array of coverage zones
 * @returns {Object} - {available: boolean, zone: Object|null, message: string}
 */
export function validateCoverage(point, zones) {
  console.log('[CoverageHelper] Validating coverage for point:', point);

  if (!point || !point.lat || !point.lng) {
    return {
      available: false,
      zone: null,
      message: 'Ubicación inválida'
    };
  }

  const zone = findCoverageZone(point, zones);

  if (zone) {
    console.log('[CoverageHelper] Coverage found:', zone.name);
    
    // Verificamos si la zona está dentro de su horario de atención
    if (!isZoneOperating(zone)) {
       return {
         available: false,
         zone: zone,
         message: `La zona ${zone.name} está fuera del horario de servicio actualmente.`
       };
    }

    return {
      available: true,
      zone: zone,
      message: `Servicio disponible en ${zone.name}`
    };
  }

  console.log('[CoverageHelper] No coverage found for point');
  return {
    available: false,
    zone: null,
    message: 'Aún no tenemos cobertura en tu ubicación. ¡Pronto llegaremos!'
  };
}

/**
 * Calculate distance between two points (Haversine formula)
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {number} - Distance in kilometers
 */
export function calculateDistance(point1, point2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Get center point of a polygon
 * @param {Array} polygon - Array of {lat, lng} points
 * @returns {Object} - {lat, lng}
 */
export function getPolygonCenter(polygon) {
  if (!polygon || polygon.length === 0) return { lat: 0, lng: 0 };

  const total = polygon.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: total.lat / polygon.length,
    lng: total.lng / polygon.length
  };
}