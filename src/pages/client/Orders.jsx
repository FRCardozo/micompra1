import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../components/layouts/ClientLayout';
import { Card, Badge, LoadingSpinner, EmptyState } from '../../components/common';
import { supabase } from '../../lib/supabase';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const statusConfig = {
    created: { label: 'Creado', color: 'bg-gray-100 text-gray-700', icon: '📝' },
    accepted_by_store: { label: 'Aceptado', color: 'bg-blue-100 text-blue-700', icon: '✓' },
    assigned_to_driver: { label: 'Repartidor asignado', color: 'bg-indigo-100 text-indigo-700', icon: '🛵' },
    picked_up: { label: 'Recogido', color: 'bg-purple-100 text-purple-700', icon: '📦' },
    delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700', icon: '✅' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: '❌' },
  };

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Activos' },
    { id: 'delivered', label: 'Entregados' },
    { id: 'cancelled', label: 'Cancelados' },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores!orders_store_id_fkey (name, logo_url)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    switch (filter) {
      case 'active':
        return orders.filter(order =>
          ['created', 'accepted_by_store', 'assigned_to_driver', 'driver_heading_to_store', 'picked_up', 'driver_heading_to_client'].includes(order.status)
        );
      case 'delivered':
        return orders.filter(order => order.status === 'delivered');
      case 'cancelled':
        return orders.filter(order => order.status === 'cancelled');
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `Hace ${diffInMinutes} minutos`;
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} horas`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis pedidos</h1>
          <p className="text-gray-600">Consulta el estado de tus pedidos</p>
        </div>

        {/* Filters */}
        <div className="overflow-x-auto pb-2">
          <div className="flex space-x-3">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${filter === f.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.created;
              const store = order.store || {};

              return (
                <Card
                  key={order.id}
                  hover
                  onClick={() => handleOrderClick(order.id)}
                  padding="md"
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        {store.logo_url ? (
                          <img
                            src={store.logo_url}
                            alt={store.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <span className="text-3xl">🏪</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {store.name || 'Tienda'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Pedido #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1 ${status.color}`}>
                      <span>{status.icon}</span>
                      <span>{status.label}</span>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Total</p>
                      <p className="font-bold text-gray-900">
                        ${order.total?.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Pago</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {order.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                      <p className="text-xs text-gray-600 mb-1">Dirección</p>
                      <p className="font-medium text-gray-900 text-sm line-clamp-1">
                        {order.delivery_address}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOrderClick(order.id);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Ver detalles →
                    </button>
                    {['accepted_by_store', 'assigned_to_driver', 'picked_up'].includes(order.status) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrderClick(order.id);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Rastrear pedido
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="📦"
            title={
              filter === 'all'
                ? 'No tienes pedidos'
                : `No hay pedidos ${filter === 'active' ? 'activos' : filter === 'delivered' ? 'entregados' : 'cancelados'}`
            }
            message={
              filter === 'all'
                ? 'Realiza tu primera orden para comenzar'
                : 'Prueba con otro filtro para ver más pedidos'
            }
          />
        )}

        {/* Help Section */}
        {!loading && orders.length > 0 && (
          <Card padding="md" className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
            <div className="flex items-start space-x-3">
              <span className="text-3xl">💬</span>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">¿Necesitas ayuda?</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Si tienes algún problema con tu pedido, estamos aquí para ayudarte
                </p>
                <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                  Contactar soporte →
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </ClientLayout>
  );
};

export default Orders;
