import { MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';

/**
 * Badge visual para mostrar estado de cobertura
 * Se puede usar en headers, footers, cards, etc.
 */
export default function CoverageBadge({ zone, variant = 'default', showDetails = false }) {
  if (!zone) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
        variant === 'default'
          ? 'bg-red-100 text-red-700'
          : 'bg-red-50 text-red-600 border border-red-200'
      }`}>
        <XCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Sin cobertura</span>
      </div>
    );
  }

  const isActive = zone.is_active !== false;

  if (!isActive) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
        variant === 'default'
          ? 'bg-gray-100 text-gray-700'
          : 'bg-gray-50 text-gray-600 border border-gray-200'
      }`}>
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">Zona inactiva</span>
      </div>
    );
  }

  if (showDetails) {
    return (
      <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg ${
        variant === 'default'
          ? 'bg-green-100 text-green-800'
          : 'bg-green-50 text-green-700 border border-green-200'
      }`}>
        <CheckCircle className="w-5 h-5" />
        <div className="text-left">
          <p className="text-sm font-semibold">{zone.name}</p>
          {zone.city && (
            <p className="text-xs opacity-80">{zone.city}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
      variant === 'default'
        ? 'bg-green-100 text-green-700'
        : 'bg-green-50 text-green-600 border border-green-200'
    }`}>
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm font-medium">
        {zone.name || 'Zona activa'}
      </span>
    </div>
  );
}

/**
 * Componente simplificado para mostrar solo el ícono de cobertura
 */
export function CoverageIcon({ hasCoeverage, className = '' }) {
  return hasCoverage ? (
    <MapPin className={`text-green-600 ${className}`} />
  ) : (
    <MapPin className={`text-red-600 ${className}`} />
  );
}
