import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  MapPin,
  Clock,
  DollarSign,
  Navigation,
  CheckCircle,
  ChevronRight,
  Search
} from 'lucide-react';
import DriverLayout from '../../components/driver/DriverLayout';
import { Card, Badge, Button, EmptyState, LoadingSpinner } from '../../components/common';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const Orders = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState({
    available: [],
    inProgress: [],
    completed: []
  });

  useEffect(() => {
    if (profile) {
      loadOrders();
    }
  }, [profile, activeTab]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      let query = supabase.from('orders').select(`
        *,
        store:stores(id, name, address, logo_url),
        client:profiles!orders_client_id_fkey(id, full_name, phone)
      `);

      if (activeTab === 'available') {
        query = query.eq('status', 'assigned_to_driver').is('driver_id', null);
      } else if (activeTab === 'inProgress') {
        query = query.in('status', ['driver_heading_to_store', 'picked_up', 'driver_heading_to_client']).eq('driver_id', profile.id);
      } else {
        query = query.eq('status', 'delivered').eq('driver_id', profile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(prev => ({
        ...prev,
        [activeTab]: data || []
      }));
    } catch (error) {
      console.error('Error loading driver orders:', error);
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
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
      loadOrders();
    } catch (error) {
      toast.error('Error al aceptar pedido');
    }
  };

  const tabs = [
    { id: 'available', label: 'Disponibles', count: orders.available.length },
    { id: 'inProgress', label: 'En Curso', count: orders.inProgress.length },
    { id: 'completed', label: 'Completados', count: orders.completed.length }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      picking_up: { label: 'Recogiendo', variant: 'warning' },
      delivering: { label: 'En camino', variant: 'primary' }
    };
    return statusConfig[status] || { label: status, variant: 'default' };
  };

  const filteredOrders = (orders[activeTab] || []).filter(order =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.store?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order.client && order.client.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderAvailableOrders = () => (
    <div className="space-y-4">
      {filteredOrders.map((order) => (
        <Card key={order.id} hover className="transition-all">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">{order.store?.name}</h3>
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

            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Recoger en</p>
                  <p className="text-sm text-gray-900 mt-0.5">{order.store?.address}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Navigation className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">Entregar en</p>
                  <p className="text-sm text-gray-900 mt-0.5">{order.delivery_address}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Package className="w-4 h-4" />
                  <span>{order.items} items</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{order.distance} km</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{order.estimatedTime}</span>
                </div>
              </div>

              <Button onClick={() => handleAcceptOrder(order.id)} variant="primary" size="sm">
                Aceptar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderInProgressOrders = () => (
    <div className="space-y-4">
      {filteredOrders.map((order) => {
        const statusConfig = getStatusBadge(order.status);
        return (
          <Link key={order.id} to={`/driver/orders/${order.id}`}>
            <Card hover className="transition-all">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{order.store?.name}</h3>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">#{order.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      ${parseFloat(order.total || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Recoger en</p>
                      <p className="text-sm text-gray-900 mt-0.5">{order.store?.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Navigation className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Entregar a</p>
                      <p className="text-sm text-gray-900 mt-0.5">
                        {order.client?.full_name} - {order.delivery_address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Package className="w-4 h-4" />
                      <span>{order.items} items</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{order.distance} km</span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );

  const renderCompletedOrders = () => (
    <div className="space-y-4">
      {filteredOrders.map((order) => (
        <Link key={order.id} to={`/driver/orders/${order.id}`}>
          <Card hover className="transition-all">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{order.store?.name}</h3>
                    <Badge variant="success" dot>
                      Completado
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">#{order.id.slice(0, 8)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    ${parseFloat(order.total || 0).toLocaleString()}
                  </p>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    {[...Array(order.rating)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-4 h-4 fill-yellow-400"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Cliente</span>
                  <span className="font-medium text-gray-900">{order.client?.full_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Distancia</span>
                  <span className="font-medium text-gray-900">{order.distance} km</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completado</span>
                  <span className="font-medium text-gray-900">
                    {new Date(order.delivered_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Package className="w-4 h-4" />
                  <span>{order.items} items</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      );
    }
    if (filteredOrders.length === 0) {
      const emptyStateConfig = {
        available: {
          title: 'No hay pedidos disponibles',
          description: 'Te notificaremos cuando haya nuevos pedidos en tu zona'
        },
        inProgress: {
          title: 'No tienes pedidos en curso',
          description: 'Acepta pedidos disponibles para comenzar'
        },
        completed: {
          title: 'No has completado pedidos',
          description: 'Tus pedidos completados apareceran aqui'
        }
      };

      return (
        <EmptyState
          icon={Package}
          title={emptyStateConfig[activeTab].title}
          description={emptyStateConfig[activeTab].description}
        />
      );
    }

    switch (activeTab) {
      case 'available':
        return renderAvailableOrders();
      case 'inProgress':
        return renderInProgressOrders();
      case 'completed':
        return renderCompletedOrders();
      default:
        return null;
    }
  };

  return (
    <DriverLayout>
      <div className="space-y-6 pb-20 md:pb-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Mis Pedidos
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus pedidos y entregas
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por ID, tienda o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id
                    ? 'bg-white text-blue-500'
                    : 'bg-gray-100 text-gray-600'
                  }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </DriverLayout>
  );
};

export default Orders;
