import { useState, useEffect } from 'react';
import { X, TrendingUp, Package, DollarSign, Clock, Users, Store as StoreIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function ZoneStatsModal({ zone, onClose }) {
  const [stats, setStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadZoneData();
  }, [zone.id]);

  const loadZoneData = async () => {
    console.log('[ZoneStatsModal] Loading zone data:', zone.id);

    try {
      // Cargar estadísticas (simuladas por ahora)
      // En producción, estas vendrían de coverage_zone_stats
      const mockStats = {
        total_orders: 0,
        total_revenue: 0,
        average_delivery_time: zone.estimated_delivery_time_minutes,
        active_stores: 0,
        active_drivers: 0,
        peak_hours: []
      };

      setStats(mockStats);

      // Cargar tiendas en esta zona
      // Por ahora, cargar todas las tiendas (en producción, filtrar por ubicación)
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .limit(10);

      if (storesError) throw storesError;
      setStores(storesData || []);

      // Cargar domiciliarios en esta zona
      const { data: driversData, error: driversError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'delivery_driver')
        .limit(10);

      if (driversError) throw driversError;
      setDrivers(driversData || []);

      console.log('[ZoneStatsModal] Data loaded successfully');
    } catch (error) {
      console.error('[ZoneStatsModal] Error loading data:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Estadísticas de Zona</h2>
            <p className="text-sm text-gray-600 mt-1">{zone.name} - {zone.city}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">Pedidos</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{stats.total_orders}</p>
              <p className="text-xs text-blue-600 mt-1">Total histórico</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Ingresos</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                ${stats.total_revenue.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">Total histórico</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-purple-600 font-medium">Tiempo</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{stats.average_delivery_time}</p>
              <p className="text-xs text-purple-600 mt-1">Minutos promedio</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-orange-600 font-medium">Demanda</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">Media</p>
              <p className="text-xs text-orange-600 mt-1">Nivel actual</p>
            </div>
          </div>

          {/* Configuración de zona */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Configuración Actual</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Costo base de envío</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${zone.base_delivery_cost?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tiempo estimado</p>
                <p className="text-lg font-semibold text-gray-900">
                  {zone.estimated_delivery_time_minutes} minutos
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Prioridad</p>
                <p className="text-lg font-semibold text-gray-900">{zone.priority}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p className={`text-lg font-semibold ${
                  zone.is_active ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {zone.is_active ? 'Activa' : 'Inactiva'}
                </p>
              </div>
            </div>
          </div>

          {/* Tiendas en la zona */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <StoreIcon className="w-5 h-5" />
                Tiendas Disponibles
              </h3>
              <span className="text-sm text-gray-600">{stores.length} tiendas</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stores.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay tiendas registradas en esta zona
                </p>
              ) : (
                stores.map((store) => (
                  <div
                    key={store.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {store.logo_url ? (
                        <img
                          src={store.logo_url}
                          alt={store.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <StoreIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{store.name}</p>
                        <p className="text-xs text-gray-600">{store.category}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      store.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {store.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Domiciliarios en la zona */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Domiciliarios Disponibles
              </h3>
              <span className="text-sm text-gray-600">{drivers.length} domiciliarios</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {drivers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay domiciliarios registrados en esta zona
                </p>
              ) : (
                drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {driver.avatar_url ? (
                        <img
                          src={driver.avatar_url}
                          alt={driver.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{driver.full_name}</p>
                        <p className="text-xs text-gray-600">{driver.phone}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      driver.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {driver.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botón cerrar */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
