import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Navigation, Loader2, Map } from 'lucide-react';

const LocationSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const dropdownRef = useRef(null);
  
  // Leemos si ya hay una ubicación guardada, si no, mostramos un texto invitando a elegir
  const [location, setLocation] = useState(() => {
    return localStorage.getItem('userLocation') || 'Selecciona tu ubicación';
  });

  const availableZones = [
    { id: 'since', name: 'San Luis de Sincé, Sucre' },
    { id: 'galeras', name: 'Galeras, Sucre' }
  ];

  // Cerrar el menú si se hace clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveLocation = (newLocation) => {
    setLocation(newLocation);
    localStorage.setItem('userLocation', newLocation);
    setIsOpen(false);
    // Aquí a futuro puedes disparar un evento o contexto para que Home.jsx filtre las tiendas
  };

  const detectLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Usamos la API de OpenStreetMap
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            
            const address = data.address;
            const city = address.city || address.town || address.village;
            const finalLocation = city ? `${city}, Sucre` : 'Ubicación detectada';
            
            saveLocation(finalLocation);
          } catch (error) {
            alert("No pudimos obtener el nombre de tu ciudad, pero tenemos tus coordenadas.");
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          alert("Por favor, permite el acceso a tu ubicación en el navegador para detectarla automáticamente.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      alert("Tu navegador no soporta geolocalización.");
      setIsLocating(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* EL BOTÓN QUE VA EN LA CABECERA */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-xl transition-colors max-w-[200px] sm:max-w-[250px]"
      >
        <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
        <div className="flex flex-col items-start text-left truncate">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none">
            Entregar en
          </span>
          <span className="text-sm font-black text-gray-900 truncate w-full leading-tight">
            {location}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* EL MENÚ DESPLEGABLE */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          
          <div className="p-2">
            {/* Opción Automática */}
            <button 
              onClick={detectLocation}
              disabled={isLocating}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 text-blue-700 transition-colors text-left"
            >
              {isLocating ? (
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              ) : (
                <Navigation className="w-5 h-5 shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm">Usar mi ubicación actual</p>
                <p className="text-xs text-blue-500/70">Activa el GPS para mayor precisión</p>
              </div>
            </button>
          </div>

          <div className="bg-gray-50 px-4 py-2 border-y border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Map className="w-3 h-3" /> Zonas de Cobertura
            </span>
          </div>

          <div className="p-2 space-y-1">
            {/* Opciones Manuales */}
            {availableZones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => saveLocation(zone.name)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                  location === zone.name ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <MapPin className={`w-5 h-5 shrink-0 ${location === zone.name ? 'text-orange-500' : 'text-gray-400'}`} />
                <span className="font-bold text-sm">{zone.name}</span>
              </button>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};

export default LocationSelector;