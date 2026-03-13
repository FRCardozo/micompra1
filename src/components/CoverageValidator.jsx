import { useState, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateCoverage, isZoneOperating } from '../lib/coverageHelper';

/**
 * Componente para validar si hay cobertura en una ubicación específica
 * Se usa en checkout y páginas de cliente
 */
export default function CoverageValidator({ location, onValidation }) {
  const [zones, setZones] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    if (zones.length > 0 && location) {
      validateLocation();
    }
  }, [zones, location]);

  const loadZones = async () => {
    console.log('[CoverageValidator] Loading active zones');
    try {
      const { data, error } = await supabase
        .from('coverage_zones')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      console.log('[CoverageValidator] Loaded zones:', data?.length || 0);
      setZones(data || []);
    } catch (error) {
      console.error('[CoverageValidator] Error loading zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateLocation = () => {
    console.log('[CoverageValidator] Validating location:', location);

    const result = validateCoverage(location, zones);

    // Si hay zona, verificar horarios
    if (result.zone) {
      const isOperating = isZoneOperating(result.zone);
      result.isOperating = isOperating;

      if (!isOperating) {
        result.message = `Servicio disponible en ${result.zone.name}, pero fuera de horario`;
      }
    }

    setValidationResult(result);

    // Notificar al padre
    if (onValidation) {
      onValidation(result);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Verificando cobertura...</span>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <MapPin className="w-5 h-5 text-yellow-600 flex-shrink-0" />
        <span className="text-sm text-yellow-800">
          Selecciona tu ubicación para verificar cobertura
        </span>
      </div>
    );
  }

  if (!validationResult) {
    return null;
  }

  if (!validationResult.available) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-start gap-3 mb-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-1">
              Sin Cobertura en tu Zona
            </h4>
            <p className="text-sm text-red-800">
              {validationResult.message}
            </p>
          </div>
        </div>

        <div className="mt-3 p-3 bg-white rounded-lg border border-red-100">
          <p className="text-xs text-gray-600 mb-2">
            ¿Quieres que llegemos a tu zona?
          </p>
          <a
            href="mailto:fabian.cardozo@hotmail.com?subject=Solicitud de Cobertura"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Solicitar cobertura →
          </a>
        </div>
      </div>
    );
  }

  const { zone, isOperating } = validationResult;

  if (!isOperating) {
    return (
      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-orange-900 mb-1">
              Fuera de Horario
            </h4>
            <p className="text-sm text-orange-800 mb-2">
              {validationResult.message}
            </p>
            <p className="text-xs text-orange-700">
              Vuelve durante el horario de operación de la zona.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
      <div className="flex items-start gap-3 mb-3">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-green-900 mb-1">
            ¡Servicio Disponible!
          </h4>
          <p className="text-sm text-green-800">
            {validationResult.message}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-green-100">
          <DollarSign className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-xs text-gray-600">Costo base</p>
            <p className="text-sm font-semibold text-gray-900">
              ${zone.base_delivery_cost?.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-green-100">
          <Clock className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-xs text-gray-600">Tiempo est.</p>
            <p className="text-sm font-semibold text-gray-900">
              {zone.estimated_delivery_time_minutes} min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
