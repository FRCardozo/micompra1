import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para iconos de Leaflet en Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function CoverageMap({ zones = [], onZoneClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef([]);

  useEffect(() => {
    console.log('[CoverageMap] Initializing map');

    // Inicializar mapa
    if (!mapInstanceRef.current && mapRef.current) {
      // Centro por defecto: Galeras, Sucre
      mapInstanceRef.current = L.map(mapRef.current).setView([8.9167, -75.1833], 13);

      // Añadir capa de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);

      console.log('[CoverageMap] Map initialized');

      // FIX: Forzar a Leaflet a recalcular su tamaño una vez que el DOM pintó el contenedor
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    }

    return () => {
      // Limpiar mapa al desmontar
      if (mapInstanceRef.current) {
        console.log('[CoverageMap] Cleaning up map');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !zones) return;

    console.log('[CoverageMap] Rendering zones:', zones.length);

    // Limpiar capas anteriores
    layersRef.current.forEach(layer => {
      mapInstanceRef.current.removeLayer(layer);
    });
    layersRef.current = [];

    // Si no hay zonas, volver al centro por defecto
    if (zones.length === 0) {
      mapInstanceRef.current.setView([8.9167, -75.1833], 13);
      return;
    }

    // Dibujar cada zona
    zones.forEach(zone => {
      try {
        // Convertir polígono a formato Leaflet
        const polygon = zone.polygon.map(point => [point.lat, point.lng]);

        // Color según estado
        const color = zone.is_active ? '#10b981' : '#6b7280';
        const fillColor = zone.is_active ? '#10b981' : '#6b7280';

        // Crear polígono
        const polygonLayer = L.polygon(polygon, {
          color: color,
          fillColor: fillColor,
          fillOpacity: 0.2,
          weight: 2
        }).addTo(mapInstanceRef.current);

        // Añadir popup
        const popupContent = `
          <div class="text-sm">
            <div class="font-semibold mb-1">${zone.name}</div>
            <div class="text-gray-600">${zone.city}</div>
            <div class="mt-2 text-xs">
              <div>Costo base: $${zone.base_delivery_cost?.toLocaleString()}</div>
              <div>Tiempo: ${zone.estimated_delivery_time_minutes} min</div>
              <div class="mt-1">
                <span class="px-2 py-0.5 rounded-full ${
                  zone.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }">
                  ${zone.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          </div>
        `;

        polygonLayer.bindPopup(popupContent);

        // Click en zona
        if (onZoneClick) {
          polygonLayer.on('click', () => {
            console.log('[CoverageMap] Zone clicked:', zone.id);
            onZoneClick(zone);
          });
        }

        // Añadir marcador en el centro
        const marker = L.marker([zone.center_lat, zone.center_lng], {
          title: zone.name
        }).addTo(mapInstanceRef.current);

        marker.bindPopup(popupContent);

        if (onZoneClick) {
          marker.on('click', () => {
            console.log('[CoverageMap] Marker clicked:', zone.id);
            onZoneClick(zone);
          });
        }

        layersRef.current.push(polygonLayer, marker);
      } catch (error) {
        console.error('[CoverageMap] Error rendering zone:', zone.id, error);
      }
    });

    // Ajustar vista para mostrar todas las zonas
    if (zones.length > 0) {
      const bounds = [];
      zones.forEach(zone => {
        zone.polygon.forEach(point => {
          bounds.push([point.lat, point.lng]);
        });
      });

      if (bounds.length > 0) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [zones, onZoneClick]);

  return (
    // FIX: z-0 y relative para evitar que el mapa cubra otros elementos de la UI
    <div className="w-full h-full min-h-[400px] lg:min-h-[600px] rounded-lg relative z-0">
      <div ref={mapRef} className="absolute inset-0 w-full h-full rounded-lg" />
    </div>
  );
}