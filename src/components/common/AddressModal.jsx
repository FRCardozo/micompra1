import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button, Input } from './index';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function AddressModal({ isOpen, onClose, onSave, editingAddress }) {
  const DEFAULT_LAT = 8.9167; // Centro de Galeras estricto
  const DEFAULT_LNG = -75.1833;

  const [formData, setFormData] = useState({
    address_name: '',
    address_line: '',
    instructions: '',
    is_default: false,
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG
  });

  const [loading, setLoading] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editingAddress) {
        setFormData({
          address_name: editingAddress.address_name || '',
          address_line: editingAddress.address_line || '',
          instructions: editingAddress.instructions || '',
          is_default: editingAddress.is_default || false,
          latitude: editingAddress.latitude || DEFAULT_LAT,
          longitude: editingAddress.longitude || DEFAULT_LNG
        });
      } else {
        handleGetLocation();
      }
    }
  }, [isOpen, editingAddress]);

  // Geocodificación Inversa: Convertir Lat/Lng a texto
  const reverseGeocode = async (lat, lng) => {
    setFetchingAddress(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      
      if (data && data.display_name) {
        // Extraemos una versión corta de la dirección
        const shortAddress = data.address.road 
          ? `${data.address.road}${data.address.house_number ? ' #' + data.address.house_number : ''}, ${data.address.town || data.address.city || ''}`
          : data.display_name.split(',').slice(0, 2).join(', ');
          
        setFormData(prev => ({ ...prev, address_line: shortAddress }));
      }
    } catch (error) {
      console.warn('Error en reverse geocoding:', error);
    } finally {
      setFetchingAddress(false);
    }
  };

  useEffect(() => {
    if (isOpen && !mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([formData.latitude, formData.longitude], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);

      markerRef.current = L.marker([formData.latitude, formData.longitude], {
        draggable: true
      }).addTo(mapInstanceRef.current);

      // Cuando el usuario suelta el pin
      markerRef.current.on('dragend', (e) => {
        const position = e.target.getLatLng();
        setFormData(prev => ({
          ...prev,
          latitude: position.lat,
          longitude: position.lng
        }));
        // Traducir las nuevas coordenadas a texto
        reverseGeocode(position.lat, position.lng);
      });

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);
    }

    return () => {
      if (mapInstanceRef.current && !isOpen) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const newLatLng = new L.LatLng(formData.latitude, formData.longitude);
      markerRef.current.setLatLng(newLatLng);
      mapInstanceRef.current.setView(newLatLng);
    }
  }, [formData.latitude, formData.longitude]);

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          reverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('GPS denegado o fallido. Forzando Galeras.', error);
          setFormData(prev => ({
            ...prev,
            latitude: DEFAULT_LAT,
            longitude: DEFAULT_LNG
          }));
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData, editingAddress?.id);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900">
            {editingAddress ? 'Editar dirección' : 'Nueva dirección'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 h-full">
            
            <div className="flex flex-col space-y-3 h-[300px] md:h-full">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Ubica el pin en tu casa
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md"
                >
                  <Navigation className="w-3 h-3" />
                  Mi ubicación
                </button>
              </div>
              <div className="w-full flex-1 rounded-xl overflow-hidden border-2 border-blue-100 relative z-0">
                <div ref={mapRef} className="absolute inset-0 w-full h-full" />
              </div>
              <p className="text-xs text-gray-500 text-center">
                Arrastra el marcador rojo hasta tu ubicación exacta.
              </p>
            </div>

            <div className="flex flex-col space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Etiqueta (Ej: Casa)</label>
                <Input
                  required
                  value={formData.address_name}
                  onChange={(e) => setFormData({ ...formData, address_name: e.target.value })}
                  placeholder="Ej: Mi Casa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  Dirección sugerida
                  {fetchingAddress && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
                </label>
                <Input
                  required
                  value={formData.address_line}
                  onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                  placeholder={fetchingAddress ? "Buscando calle..." : "Mueve el pin para autocompletar"}
                  disabled={fetchingAddress}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Instrucciones extra (Opcional)</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Casa de rejas rojas, al lado de la tienda..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  id="chk_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="chk_default" className="text-sm text-gray-700">Marcar como predeterminada</label>
              </div>

              <div className="flex-1"></div>

              <div className="flex space-x-3 pt-4 border-t border-gray-100 mt-auto">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" loading={loading} disabled={fetchingAddress}>
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}