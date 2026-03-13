import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Search, DollarSign, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function ZoneModal({ zone, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: '',
    municipality: '',
    state: 'Sucre',
    country: 'Colombia',
    center_lat: 8.9167,
    center_lng: -75.1833,
    polygon: [],
    is_active: true,
    base_delivery_cost: 2000,
    estimated_delivery_time_minutes: 30,
    priority: 1,
    operating_hours: {
      monday: { open: '08:00', close: '22:00', active: true },
      tuesday: { open: '08:00', close: '22:00', active: true },
      wednesday: { open: '08:00', close: '22:00', active: true },
      thursday: { open: '08:00', close: '22:00', active: true },
      friday: { open: '08:00', close: '23:59', active: true },
      saturday: { open: '08:00', close: '23:59', active: true },
      sunday: { open: '08:00', close: '22:00', active: true }
    }
  });

  const [citySearch, setCitySearch] = useState('');
  const [saving, setSaving] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const drawingRef = useRef(false);
  const tempPolygonRef = useRef([]);

  useEffect(() => {
    if (zone) {
      console.log('[ZoneModal] Loading zone data:', zone.id);
      setFormData({
        name: zone.name || '',
        description: zone.description || '',
        city: zone.city || '',
        municipality: zone.municipality || '',
        state: zone.state || 'Sucre',
        country: zone.country || 'Colombia',
        center_lat: zone.center_lat || 8.9167,
        center_lng: zone.center_lng || -75.1833,
        polygon: zone.polygon || [],
        is_active: zone.is_active !== false,
        base_delivery_cost: zone.base_delivery_cost || 2000,
        estimated_delivery_time_minutes: zone.estimated_delivery_time_minutes || 30,
        priority: zone.priority || 1,
        operating_hours: zone.operating_hours || formData.operating_hours
      });
    }
  }, [zone]);

  useEffect(() => {
    console.log('[ZoneModal] Initializing map editor');

    if (!mapInstanceRef.current && mapRef.current) {
      // Inicializar mapa
      mapInstanceRef.current = L.map(mapRef.current).setView(
        [formData.center_lat, formData.center_lng],
        13
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);

      // Si hay polígono existente, dibujarlo
      if (formData.polygon && formData.polygon.length > 0) {
        drawPolygon(formData.polygon);
      }

      // Click en el mapa para dibujar
      mapInstanceRef.current.on('click', handleMapClick);

      // FIX CRÍTICO: Recalcular tamaño tras animación del modal para evitar mapa roto
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleMapClick = (e) => {
    if (!drawingRef.current) return;

    const { lat, lng } = e.latlng;
    console.log('[ZoneModal] Adding point to polygon:', lat, lng);

    tempPolygonRef.current.push({ lat, lng });

    // Redibujar polígono temporal
    drawPolygon(tempPolygonRef.current, true);
  };

  const drawPolygon = (points, isTemp = false) => {
    if (!mapInstanceRef.current) return;

    // Limpiar polígono anterior
    if (polygonLayerRef.current) {
      mapInstanceRef.current.removeLayer(polygonLayerRef.current);
    }

    if (points.length < 3) return;

    // Convertir a formato Leaflet
    const latlngs = points.map(p => [p.lat, p.lng]);

    // Dibujar polígono
    polygonLayerRef.current = L.polygon(latlngs, {
      color: isTemp ? '#3b82f6' : '#10b981',
      fillColor: isTemp ? '#3b82f6' : '#10b981',
      fillOpacity: 0.2,
      weight: 2
    }).addTo(mapInstanceRef.current);

    // Calcular centro
    const bounds = polygonLayerRef.current.getBounds();
    const center = bounds.getCenter();

    if (!isTemp) {
      setFormData(prev => ({
        ...prev,
        center_lat: center.lat,
        center_lng: center.lng
      }));
    }
  };

  const handleStartDrawing = () => {
    console.log('[ZoneModal] Starting polygon drawing');
    drawingRef.current = true;
    tempPolygonRef.current = [];
    toast.success('Haz click en el mapa para dibujar el polígono');
  };

  const handleFinishDrawing = () => {
    console.log('[ZoneModal] Finishing polygon drawing');
    drawingRef.current = false;

    if (tempPolygonRef.current.length < 3) {
      toast.error('El polígono debe tener al menos 3 puntos');
      return;
    }

    setFormData(prev => ({
      ...prev,
      polygon: tempPolygonRef.current
    }));

    drawPolygon(tempPolygonRef.current, false);
    toast.success('Polígono guardado');
  };

  const handleClearPolygon = () => {
    console.log('[ZoneModal] Clearing polygon');
    drawingRef.current = false;
    tempPolygonRef.current = [];

    if (polygonLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    setFormData(prev => ({
      ...prev,
      polygon: []
    }));

    toast.success('Polígono eliminado');
  };

  const handleCitySearch = async () => {
    if (!citySearch.trim()) return;

    console.log('[ZoneModal] Searching city:', citySearch);
    toast.loading('Buscando ciudad...');

    try {
      // Usar API de Nominatim (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(citySearch)}&country=Colombia&limit=1`
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        console.log('[ZoneModal] City found:', result.display_name, lat, lng);

        setFormData(prev => ({
          ...prev,
          city: result.display_name.split(',')[0],
          center_lat: lat,
          center_lng: lng
        }));

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 13);
        }

        toast.dismiss();
        toast.success('Ciudad encontrada');
      } else {
        toast.dismiss();
        toast.error('Ciudad no encontrada');
      }
    } catch (error) {
      console.error('[ZoneModal] Error searching city:', error);
      toast.dismiss();
      toast.error('Error al buscar ciudad');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[ZoneModal] Submitting zone');

    if (!formData.name || !formData.city) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (formData.polygon.length < 3) {
      toast.error('Debes dibujar el polígono de cobertura');
      return;
    }

    setSaving(true);

    try {
      // Importante: solo enviar columnas que existen en la tabla coverage_zones
      const zoneData = {
        name: formData.name,
        city: formData.city,
        // columnas NOT NULL en la tabla
        center_lat: parseFloat(formData.center_lat),
        center_lng: parseFloat(formData.center_lng),
        // configuración de cobertura
        polygon: formData.polygon,
        is_active: formData.is_active,
        base_delivery_cost: parseFloat(formData.base_delivery_cost),
        estimated_delivery_time_minutes: parseInt(formData.estimated_delivery_time_minutes),
        priority: parseInt(formData.priority),
        operating_hours: formData.operating_hours
      };

      let error;

      if (zone) {
        console.log('[ZoneModal] Updating zone:', zone.id);
        ({ error } = await supabase
          .from('coverage_zones')
          .update(zoneData)
          .eq('id', zone.id));
      } else {
        console.log('[ZoneModal] Creating new zone');
        ({ error } = await supabase
          .from('coverage_zones')
          .insert([zoneData]));
      }

      if (error) throw error;

      toast.success(zone ? 'Zona actualizada' : 'Zona creada correctamente');
      onSave();
    } catch (error) {
      console.error('[ZoneModal] Error saving zone:', error);
      toast.error('Error al guardar zona');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {zone ? 'Editar Zona' : 'Nueva Zona de Cobertura'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Define el área donde la app estará disponible
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Contenido principal con dos columnas */}
          <div className="flex-1 grid lg:grid-cols-2 gap-6 p-6 overflow-y-auto">
            {/* Columna izquierda: Formulario */}
            <div className="space-y-6">
              {/* Información básica */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Información Básica
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Zona *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Centro - Galeras"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Descripción opcional de la zona"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar Ciudad/Municipio *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCitySearch())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Buscar ciudad..."
                    />
                    <button
                      type="button"
                      onClick={handleCitySearch}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre de la ciudad"
                    required
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Zona activa</span>
                  </label>
                </div>
              </div>

              {/* Configuración */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Configuración
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo Base de Envío
                  </label>
                  <input
                    type="number"
                    value={formData.base_delivery_cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_delivery_cost: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiempo Estimado (minutos)
                  </label>
                  <input
                    type="number"
                    value={formData.estimated_delivery_time_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_delivery_time_minutes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridad
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mayor prioridad para zonas superpuestas
                  </p>
                </div>
              </div>
            </div>

            {/* Columna derecha: Mapa */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Definir Perímetro de Cobertura</h3>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleStartDrawing}
                  disabled={drawingRef.current}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Dibujar Polígono
                </button>
                <button
                  type="button"
                  onClick={handleFinishDrawing}
                  disabled={!drawingRef.current}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Terminar
                </button>
                <button
                  type="button"
                  onClick={handleClearPolygon}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Limpiar
                </button>
              </div>

              {/* FIX: z-0 relative y altura responsiva */}
              <div className="rounded-lg overflow-hidden border border-gray-300 h-[300px] lg:h-[500px] relative z-0">
                <div ref={mapRef} className="absolute inset-0 w-full h-full" />
              </div>

              <p className="text-sm text-gray-600">
                {drawingRef.current ? (
                  '🔵 Haz click en el mapa para agregar puntos al polígono'
                ) : formData.polygon.length > 0 ? (
                  `✅ Polígono con ${formData.polygon.length} puntos definido`
                ) : (
                  '⚠️ Haz click en "Dibujar Polígono" para definir el área de cobertura'
                )}
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || formData.polygon.length < 3}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Guardando...' : zone ? 'Actualizar Zona' : 'Crear Zona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}