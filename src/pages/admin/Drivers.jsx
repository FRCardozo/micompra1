import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/layouts/AdminLayout';
import { Button } from '../../components/common';
import toast from 'react-hot-toast';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadDrivers();
  }, [filter]);

  const loadDrivers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'delivery_driver')
        .order('created_at', { ascending: false });

      if (filter === 'available') {
        query = query.eq('is_available', true);
      } else if (filter === 'unavailable') {
        query = query.eq('is_available', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast.error('Error al cargar repartidores');
    } finally {
      setLoading(false);
    }
  };

  const toggleDriverStatus = async (driverId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_available: !currentStatus })
        .eq('id', driverId);

      if (error) throw error;

      toast.success('Estado actualizado exitosamente');
      loadDrivers();
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Repartidores</h1>

          {/* Filters */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos ({drivers.length})
            </Button>
            <Button
              variant={filter === 'available' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('available')}
            >
              Disponibles
            </Button>
            <Button
              variant={filter === 'unavailable' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('unavailable')}
            >
              No disponibles
            </Button>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {drivers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛵</div>
              <p className="text-gray-500">No hay repartidores registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Repartidor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">🛵</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {driver.full_name || 'Sin nombre'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {driver.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{driver.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {driver.vehicle_type === 'motorcycle' && '🏍️ Moto'}
                          {driver.vehicle_type === 'bicycle' && '🚴 Bicicleta'}
                          {driver.vehicle_type === 'car' && '🚗 Auto'}
                          {!driver.vehicle_type && 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {driver.license_plate || 'Sin placa'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          driver.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {driver.is_available ? 'Disponible' : 'No disponible'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(driver.created_at).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleDriverStatus(driver.id, driver.is_available)}
                        >
                          {driver.is_available ? 'Desactivar' : 'Activar'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Drivers;
