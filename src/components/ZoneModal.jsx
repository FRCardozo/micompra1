import { useState, useEffect } from 'react';
import { X, MapPin, DollarSign, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// --- FILTRO TOPONÍMICO INTELIGENTE ---
const cleanLocationName = (name) => {
  if (!name) return '';
  let cleaned = name;
  const blackList = ['centro', 'barrio', 'vereda', 'corregimiento', 'sector', 'municipio de', 'ciudad de', 'departamento de', 'sucre', 'colombia'];

  blackList.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  return cleaned
    .replace(/[,.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export default function ZoneModal({ zone, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: '',
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

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name || '',
        description: zone.description || '',
        city: zone.city || '',
        is_active: zone.is_active !== false,
        base_delivery_cost: zone.base_delivery_cost || 2000,
        estimated_delivery_time_minutes: zone.estimated_delivery_time_minutes || 30,
        priority: zone.priority || 1,
        operating_hours: zone.operating_hours || formData.operating_hours
      });
    }
  }, [zone]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.city) {
      toast.error('Completa el nombre y la ciudad');
      return;
    }

    setSaving(true);

    try {
      const pureCityName = cleanLocationName(formData.city);
      const pureZoneName = cleanLocationName(formData.name);

      const zoneData = {
        name: pureZoneName,
        city: pureCityName,
        // Enviamos coordenadas base de Galeras y un polígono vacío por defecto para que Supabase no arroje error si los campos son NOT NULL
        center_lat: 8.9167, 
        center_lng: -75.1833,
        polygon: [], 
        is_active: formData.is_active,
        base_delivery_cost: parseFloat(formData.base_delivery_cost),
        estimated_delivery_time_minutes: parseInt(formData.estimated_delivery_time_minutes),
        priority: parseInt(formData.priority),
        operating_hours: formData.operating_hours
      };

      let error;

      if (zone) {
        ({ error } = await supabase
          .from('coverage_zones')
          .update(zoneData)
          .eq('id', zone.id));
      } else {
        ({ error } = await supabase
          .from('coverage_zones')
          .insert([zoneData]));
      }

      if (error) throw error;

      toast.success(zone ? 'Zona de servicio actualizada' : 'Zona de servicio habilitada');
      onSave();
    } catch (error) {
      console.error('[ZoneModal] Error saving zone:', error);
      toast.error('Error al guardar la zona');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {zone ? 'Editar Zona de Servicio' : 'Nueva Zona de Servicio'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Habilita un municipio o localidad en la plataforma
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Ubicación
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Comercial *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  onBlur={(e) => setFormData(prev => ({ ...prev, name: cleanLocationName(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Ej: Galeras"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Municipio / Ciudad *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  onBlur={(e) => setFormData(prev => ({ ...prev, city: cleanLocationName(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Ej: Galeras"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                Esta zona está activa y recibiendo pedidos
              </label>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-green-600" />
              Parámetros Operativos
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Costo Base de Envío ($)</label>
                <input
                  type="number"
                  value={formData.base_delivery_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_delivery_cost: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono"
                  min="0"
                  step="100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tiempo Estimado (Minutos)</label>
                <input
                  type="number"
                  value={formData.estimated_delivery_time_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_delivery_time_minutes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Guardando...' : zone ? 'Actualizar Zona' : 'Habilitar Zona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}