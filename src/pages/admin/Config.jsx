import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { Button, Input } from '../../components/common';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

const Config = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [generalConfig, setGeneralConfig] = useState({
    app_name: 'Rappi Clone',
    support_email: 'soporte@rappiclone.com',
    support_phone: '+57 300 123 4567',
    default_delivery_cost: '3000',
    default_delivery_radius: '5',
  });

  const [cities, setCities] = useState([
    { id: '1', name: 'Galeras', active: true },
  ]);

  const [newCity, setNewCity] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    console.log('[Config] Loading configuration from database');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*');

      if (error) throw error;

      console.log('[Config] Configuration loaded:', data);

      if (data && data.length > 0) {
        const configMap = {};
        data.forEach(item => {
          configMap[item.key] = item.value;
        });

        setGeneralConfig({
          app_name: configMap.app_name || 'Rappi Clone',
          support_email: configMap.support_email || 'soporte@rappiclone.com',
          support_phone: configMap.support_phone || '+57 300 123 4567',
          default_delivery_cost: configMap.default_delivery_cost?.toString() || '3000',
          default_delivery_radius: configMap.default_delivery_radius?.toString() || '5',
        });
      }
    } catch (error) {
      console.error('[Config] Error loading configuration:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    console.log('[Config] Field changed:', name, '=', value);
    setGeneralConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    console.log('[Config] Saving configuration:', generalConfig);

    try {
      const configEntries = [
        { key: 'app_name', value: generalConfig.app_name },
        { key: 'support_email', value: generalConfig.support_email },
        { key: 'support_phone', value: generalConfig.support_phone },
        { key: 'default_delivery_cost', value: parseFloat(generalConfig.default_delivery_cost) },
        { key: 'default_delivery_radius', value: parseFloat(generalConfig.default_delivery_radius) },
      ];

      for (const entry of configEntries) {
        const { error } = await supabase
          .from('system_config')
          .upsert(
            {
              key: entry.key,
              value: entry.value,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'key' }
          );

        if (error) {
          console.error('[Config] Error saving config entry:', entry.key, error);
          throw error;
        }
      }

      console.log('[Config] Configuration saved successfully');
      toast.success('Configuración general actualizada exitosamente');
      await loadConfig();
    } catch (error) {
      console.error('[Config] Error saving configuration:', error);
      toast.error('Error al guardar configuración: ' + error.message);
    }
  };

  const handleAddCity = (e) => {
    e.preventDefault();
    if (!newCity.trim()) return;

    const city = {
      id: Date.now().toString(),
      name: newCity,
      active: true,
    };

    setCities(prev => [...prev, city]);
    setNewCity('');
    toast.success('Ciudad agregada exitosamente');
  };

  const handleToggleCity = (cityId) => {
    setCities(prev =>
      prev.map(city =>
        city.id === cityId ? { ...city, active: !city.active } : city
      )
    );
    toast.success('Estado de ciudad actualizado');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuración</h1>

          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'general' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('general')}
            >
              General
            </Button>
            <Button
              variant={activeTab === 'cities' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('cities')}
            >
              Ciudades
            </Button>
            <Button
              variant={activeTab === 'payment' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('payment')}
            >
              Métodos de pago
            </Button>
          </div>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configuración general
            </h2>
            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la aplicación
                </label>
                <Input
                  type="text"
                  name="app_name"
                  value={generalConfig.app_name}
                  onChange={handleGeneralChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de soporte
                </label>
                <Input
                  type="email"
                  name="support_email"
                  value={generalConfig.support_email}
                  onChange={handleGeneralChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono de soporte
                </label>
                <Input
                  type="tel"
                  name="support_phone"
                  value={generalConfig.support_phone}
                  onChange={handleGeneralChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo de envío por defecto (COP)
                  </label>
                  <Input
                    type="number"
                    name="default_delivery_cost"
                    value={generalConfig.default_delivery_cost}
                    onChange={handleGeneralChange}
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Radio de entrega por defecto (km)
                  </label>
                  <Input
                    type="number"
                    name="default_delivery_radius"
                    value={generalConfig.default_delivery_radius}
                    onChange={handleGeneralChange}
                    min="0"
                    step="0.1"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Guardar configuración
              </Button>
            </form>
          </div>
        )}

        {/* Cities Tab */}
        {activeTab === 'cities' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Gestión de ciudades
            </h2>

            {/* Add City Form */}
            <form onSubmit={handleAddCity} className="mb-6">
              <div className="flex gap-3">
                <Input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Nombre de la ciudad"
                  className="flex-1"
                />
                <Button type="submit">Agregar ciudad</Button>
              </div>
            </form>

            {/* Cities List */}
            <div className="space-y-3">
              {cities.map((city) => (
                <div
                  key={city.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      city.active ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <span className="font-medium text-gray-900">{city.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      city.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {city.active ? 'Activa' : 'Inactiva'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleCity(city.id)}
                    >
                      {city.active ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Métodos de pago
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💵</span>
                  <div>
                    <p className="font-medium text-gray-900">Efectivo</p>
                    <p className="text-sm text-gray-500">
                      Pago en efectivo al recibir el pedido
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Activo
                  </span>
                  <Button variant="outline" size="sm">
                    Desactivar
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏦</span>
                  <div>
                    <p className="font-medium text-gray-900">Transferencia bancaria</p>
                    <p className="text-sm text-gray-500">
                      Transferencia directa al negocio
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Activo
                  </span>
                  <Button variant="outline" size="sm">
                    Desactivar
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-900">
                💡 <strong>Nota:</strong> Los pagos se realizan directamente entre el
                cliente y el negocio. La plataforma solo facilita las transacciones.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Config;
