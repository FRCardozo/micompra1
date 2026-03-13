import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Power,
  DollarSign,
  Package,
  Clock,
  MapPin,
  Navigation,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';
import { Card, Badge, Button, LoadingSpinner } from '../../components/common';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [stats, setStats] = useState({
    deliveries: 0,
    earnings: 0,
    rating: 5.0
  });

  useEffect(() => {
    if (profile) {
      loadDriverData();
    }
  }, [profile, isOnline]);

  const loadDriverData = async () => {
    try {
      setLoading(true);

      // Fetch driver status
      const { data: driver } = await supabase
        .from('delivery_drivers')
        .select('*')
        .eq('id', profile.id)
        .single();

      if (driver) {
        setIsOnline(driver.status === 'available');
        setStats({
          deliveries: driver.total_deliveries || 0,
          earnings: driver.total_earnings || 0,
          rating: driver.rating || 5.0
        });
      }

      if (isOnline) {
        // Fetch available orders (those ready for pickup)
        const { data: orders } = await supabase
          .from('orders')
          .select(`
            *,
            stores (name, address)
          `)
          .eq('status', 'assigned_to_driver')
          .is('driver_id', null)
          .limit(10);

        setAvailableOrders(orders || []);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    const newStatus = isOnline ? 'offline' : 'available';
    try {
      const { error } = await supabase
        .from('delivery_drivers')
        .update({ status: newStatus })
        .eq('id', profile.id);

      if (error) throw error;
      setIsOnline(!isOnline);
      toast.success(isOnline ? 'Ahora estás desconectado' : 'Ahora estás en línea');
    } catch (error) {
      toast.error('Error al cambiar disponibilidad');
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          driver_id: profile.id,
          status: 'driver_heading_to_store'
        })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Pedido aceptado');
      navigate(`/driver/orders/${orderId}`);
    } catch (error) {
      toast.error('Error al aceptar pedido');
    }
  };

  if (loading && !profile) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="space-y-6 pb-20 md:pb-6">
        {/* Header with Availability Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              {isOnline ? 'Estas disponible para recibir pedidos' : 'No estas recibiendo pedidos'}
            </p>
          </div>

          {/* Availability Toggle */}
          <button
            onClick={handleToggleAvailability}
            className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${isOnline
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600'
              }`}
          >
            <Power className="w-5 h-5" />
            <span>{isOnline ? 'En Linea' : 'Desconectado'}</span>
          </button>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 2xl:gap-10">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Entregas</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {stats.deliveries}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Ganancias</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  ${stats.earnings.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Horas</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  0h
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Rating</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  {stats.rating}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Current Location */}
        <Card>
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Ubicacion Actual</h3>
              <p className="text-sm text-gray-600 mt-1">
                {currentLocation
                  ? `Lat: ${currentLocation.lat.toFixed(4)}, Lng: ${currentLocation.lng.toFixed(4)}`
                  : 'Obteniendo ubicacion...'}
              </p>
            </div>
            <Button size="sm" variant="outline">
              <Navigation className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Map Placeholder */}
        <Card padding="none">
          <div className="h-64 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Mapa de ubicacion</p>
              <p className="text-sm text-gray-500 mt-1">Integracion con Google Maps</p>
            </div>
          </div>
        </Card>

        {/* Available Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Pedidos Disponibles
            </h2>
            <Badge variant="primary">{availableOrders.length} disponibles</Badge>
          </div>

          {!isOnline ? (
            <Card>
              <div className="text-center py-8">
                <Power className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                  Activa tu disponibilidad para ver pedidos
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Cambia tu estado a "En Linea" para empezar a recibir pedidos
                </p>
              </div>
            </Card>
          ) : availableOrders.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                  No hay pedidos disponibles
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Te notificaremos cuando haya nuevos pedidos en tu zona
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <Card key={order.id} hover className="transition-all">
                  <div className="space-y-4">
                    {/* Order Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">
                            {order.stores?.name}
                          </h3>
                          <Badge variant="success">
                            ${parseFloat(order.total || 0).toLocaleString()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">#{order.id.slice(0, 8)}</p>
                      </div>
                      <Badge variant="warning" size="sm">
                        Listo para recoger
                      </Badge>
                    </div>

                    {/* Route Info */}
                    <div className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">Recoger en</p>
                          <p className="text-sm text-gray-900 mt-0.5">
                            {order.stores?.address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Navigation className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">Entregar en</p>
                          <p className="text-sm text-gray-900 mt-0.5">
                            {order.delivery_address}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Package className="w-4 h-4" />
                          <span>{order.items} items</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>Envío</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleAcceptOrder(order.id)}
                        variant="primary"
                        size="sm"
                      >
                        Aceptar
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DriverLayout>
  );
};

export default Dashboard;
