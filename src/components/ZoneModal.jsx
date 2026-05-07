import { useState, useEffect } from 'react';
import { X, MapPin, DollarSign, Save, Search, Loader2, Check, Store } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Arreglo para que el ícono de Leaflet no se rompa en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente hijo para manejar el pin arrastrable
function DraggableMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (position.lat && position.lng) {
      map.flyTo([position.lat, position.lng], 15);
    }
  }, [position.lat, position.lng, map]);

  if (!position.lat) return null;

  return (
    <Marker
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition({ lat: pos.lat, lng: pos.lng });
        },
      }}
      position={[position.lat, position.lng]}
    />
  );
}

export default function ZoneModal({ zone, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    center_lat: null,
    center_lng: null,
    is_active: true,
    base_delivery_cost: 2000,
    estimated_delivery_time_minutes: 15,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);

  useEffect(() => {
    if (zone) {
      setFormData(prev => ({
        ...prev,
        name: zone.name || '',
        city: zone.city || '',
        center_lat: zone.center_lat || null,
        center_lng: zone.center_lng || null,
        is_active: zone.is_active !== false,
        base_delivery_cost: zone.base_delivery_cost || 2000,
        estimated_delivery_time_minutes: zone.estimated_delivery_time_minutes || 15
      }));
      if (zone.center_lat && zone.center_lng) {
        setLocationVerified(true);
        setSearchQuery(zone.city);
      }
    }
  }, [zone]);

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=co`);
      const data = await response.json();
      setSearchResults(data);
      if (data.length === 0) toast.error('No se encontraron lugares');
    } catch (error) {
      toast.error('Error al conectar con el servidor de mapas');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (place) => {
    setFormData(prev => ({
      ...prev,
      city: place.display_name,
      center_lat: parseFloat(place.lat),
      center_lng: parseFloat(place.lon)
    }));
    setSearchQuery(place.display_name);
    if (!formData.name) setFormData(prev => ({ ...prev, name: place.name }));
    setSearchResults([]);
    setLocationVerified(true);
    toast.success('Ahora puedes mover el pin al punto exacto');
  };

  const updateCoordinates = (newPos) => {
    setFormData(prev => ({
      ...prev,
      center_lat: newPos.lat,
      center_lng: newPos.lng
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.city || !locationVerified) {
      toast.error('Por favor completa todos los datos y verifica el mapa');
      return;
    }

    setSaving(true);
    try {
      const zoneData = {
        ...formData,
        polygon: null 
      };

      let error;
      if (zone) {
        ({ error } = await supabase.from('coverage_zones').update(zoneData).eq('id', zone.id));
      } else {
        ({ error } = await supabase.from('coverage_zones').insert([zoneData]));
      }

      if (error) throw error;
      toast.success(zone ? 'Zona actualizada' : 'Zona habilitada');
      onSave();
    } catch (error) {
      toast.error('Error al guardar la zona');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {zone ? 'Editar Zona de Servicio' : 'Nueva Zona de Servicio'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Busca el municipio y mueve el pin al punto exacto</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Panel Izquierdo: Formulario */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-gray-100 space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">Buscar Municipio *</label>
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setLocationVerified(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchLocation())}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Galeras, Sucre"
                />
                <button onClick={handleSearchLocation} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
                
                {searchResults.length > 0 && !locationVerified && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 shadow-xl rounded-lg z-50 overflow-hidden">
                    {searchResults.map((place, idx) => (
                      <button key={idx} onClick={() => handleSelectLocation(place)} className="w-full text-left p-3 hover:bg-indigo-50 border-b">
                        <p className="font-semibold text-sm">{place.name}</p>
                        <p className="text-xs text-gray-500">{place.display_name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <hr />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Comercial *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Costo Base ($)</label>
                  <input type="number" value={formData.base_delivery_cost} onChange={(e) => setFormData({...formData, base_delivery_cost: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tiempo (Min)</label>
                  <input type="number" value={formData.estimated_delivery_time_minutes} onChange={(e) => setFormData({...formData, estimated_delivery_time_minutes: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho: Mapa */}
          <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 relative">
            {!locationVerified ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                <MapPin className="w-12 h-12 mb-2 opacity-50" />
                <p>Busca un municipio a la izquierda para cargar el mapa</p>
              </div>
            ) : (
              <>
                <MapContainer center={[formData.center_lat || 4.5709, formData.center_lng || -74.2973]} zoom={15} className="w-full h-full z-0">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <DraggableMarker 
                    position={{ lat: formData.center_lat, lng: formData.center_lng }} 
                    setPosition={updateCoordinates} 
                  />
                </MapContainer>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-gray-200 z-10 text-xs font-semibold text-indigo-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  Arrastra el pin al centro exacto
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
          <button onClick={onClose} className="px-6 py-2.5 font-semibold text-gray-600 bg-white border rounded-xl hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving || !locationVerified} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
            <Save className="w-5 h-5 inline mr-2" />
            {saving ? 'Guardando...' : 'Habilitar Zona'}
          </button>
        </div>
      </div>
    </div>
  );
}