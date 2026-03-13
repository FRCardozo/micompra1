import { useState, useEffect } from 'react';
import StoreLayout from '../../components/layouts/StoreLayout';
import { Card, LoadingSpinner, Button, Badge, Modal } from '../../components/common';
import {
  Clock,
  Package,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  User,
  MapPin,
  Phone
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Orders = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('new');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [storeId, setStoreId] = useState(null);

  const tabs = [
    { id: 'new', label: 'Nuevos', statuses: ['created'], icon: AlertCircle, color: 'yellow' },
    { id: 'preparing', label: 'En Preparación', statuses: ['accepted_by_store'], icon: Clock, color: 'blue' },
    { id: 'ready', label: 'Listos', statuses: ['assigned_to_driver'], icon: CheckCircle, color: 'green' },
    { id: 'completed', label: 'Completados', statuses: ['delivered'], icon: Package, color: 'gray' }
  ];

  useEffect(() => {
    fetchStoreAndLoadOrders();
  }, [profile, activeTab]);

  useEffect(() => {
    if (!storeId) return;

    // Subscribe to order changes
    const subscription = supabase
      .channel('store_orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${storeId}`
      }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [storeId]);

  const fetchStoreAndLoadOrders = async () => {
    try {
      setLoading(true);
      console.log('[Store Orders] Fetching store for user:', profile?.id);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('[Store Orders] No user found');
        toast.error('Debes iniciar sesión');
        return;
      }

      console.log('[Store Orders] User ID:', user.id);

      // Get store by owner_id
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (storeError) {
        console.error('[Store Orders] Store fetch error:', storeError);
        toast.error('No se encontró una tienda asociada a tu cuenta');
        setLoading(false);
        return;
      }

      if (!store) {
        console.error('[Store Orders] No store found for user');
        toast.error('No tienes una tienda asociada');
        setLoading(false);
        return;
      }

      console.log('[Store Orders] Store ID:', store.id);
      setStoreId(store.id);
      await loadOrders(store.id);
    } catch (error) {
      console.error('[Store Orders] Error in fetchStoreAndLoadOrders:', error);
      toast.error('Error al cargar la tienda');
      setLoading(false);
    }
  };

  const loadOrders = async (storeIdParam = null) => {
    try {
      const useStoreId = storeIdParam || storeId;

      if (!useStoreId) {
        console.log('[Store Orders] No store ID available, skipping loadOrders');
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log('[Store Orders] Loading orders for store:', useStoreId);
      const currentTab = tabs.find(t => t.id === activeTab);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          client:profiles!orders_client_id_fkey (
            full_name,
            email,
            phone
          ),
          order_items (
            id,
            quantity,
            unit_price,
            products (
              name,
              image_url
            )
          )
        `)
        .eq('store_id', useStoreId)
        .in('status', currentTab.statuses)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('[Store Orders] Loaded orders:', data?.length || 0);
      setOrders(data || []);
    } catch (error) {
      console.error('[Store Orders] Error loading orders:', error);
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'accepted_by_store' }) // Matches DB Enum
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Pedido aceptado');
      loadOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Error al aceptar pedido');
    }
  };

  const handleMarkReady = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'assigned_to_driver' }) // Closest state for "Ready" in enum
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Pedido marcado como listo');
      loadOrders();
    } catch (error) {
      console.error('Error marking order ready:', error);
      toast.error('Error al marcar pedido como listo');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('¿Estás seguro de cancelar este pedido?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Pedido cancelado');
      loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Error al cancelar pedido');
    }
  };

  const viewOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      created: 'yellow',
      accepted_by_store: 'blue',
      assigned_to_driver: 'green',
      delivered: 'gray',
      cancelled: 'danger'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      created: 'Pendiente',
      accepted_by_store: 'En preparación',
      assigned_to_driver: 'Listo para repartidor',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return texts[status] || status;
  };

  const OrderCard = ({ order }) => {
    const totalItems = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return (
      <Card padding="lg" className="hover:shadow-lg transition-shadow">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pedido #{order.id.slice(0, 8)}
                </h3>
                <Badge variant={getStatusColor(order.status)}>
                  {getStatusText(order.status)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(order.created_at).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                ${parseFloat(order.total || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {order.client?.full_name || 'Cliente'}
              </p>
              <p className="text-sm text-gray-600">
                {order.client?.phone || 'Sin teléfono'}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-2">
            {order.order_items?.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.products?.name}
                </span>
                <span className="font-medium text-gray-900">
                  ${(item.quantity * parseFloat(item.unit_price || 0)).toFixed(2)}
                </span>
              </div>
            ))}
            {order.order_items?.length > 3 && (
              <p className="text-sm text-gray-500">
                +{order.order_items.length - 3} más...
              </p>
            )}
          </div>

          {/* Delivery Address */}
          {order.delivery_address && (
            <div className="flex items-start space-x-2 text-sm text-gray-600 p-3 bg-blue-50 rounded-xl">
              <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>{order.delivery_address}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewOrderDetail(order)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalle
            </Button>

            {order.status === 'created' && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleAcceptOrder(order.id)}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aceptar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleCancelOrder(order.id)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </>
            )}

            {order.status === 'accepted_by_store' && (
              <Button
                variant="success"
                size="sm"
                onClick={() => handleMarkReady(order.id)}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar Listo
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <StoreLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
          <p className="text-gray-600 mt-1">
            Administra y procesa los pedidos de tu tienda
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
          <div className="flex space-x-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count = orders.length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${isActive
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {isActive && count > 0 && (
                    <span className="px-2 py-0.5 bg-purple-200 text-purple-800 text-xs font-bold rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay pedidos
              </h3>
              <p className="text-gray-600">
                No tienes pedidos en esta categoría
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={showOrderDetail}
          onClose={() => {
            setShowOrderDetail(false);
            setSelectedOrder(null);
          }}
          title={`Pedido #${selectedOrder.id.slice(0, 8)}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Status & Amount */}
            <div className="flex items-center justify-between">
              <Badge variant={getStatusColor(selectedOrder.status)} size="lg">
                {getStatusText(selectedOrder.status)}
              </Badge>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${parseFloat(selectedOrder.total || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <h4 className="font-semibold text-gray-900">Cliente</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{selectedOrder.client?.full_name || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{selectedOrder.client?.phone || 'N/A'}</span>
                </div>
                {selectedOrder.delivery_address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{selectedOrder.delivery_address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Items del Pedido</h4>
              <div className="space-y-3">
                {selectedOrder.order_items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.products?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(item.quantity * parseFloat(item.unit_price || 0)).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        ${parseFloat(item.unit_price || 0).toFixed(2)} c/u
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Details */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  ${parseFloat(selectedOrder.subtotal || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Costo de envío:</span>
                <span className="font-medium">
                  ${parseFloat(selectedOrder.delivery_cost || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="font-bold text-gray-900 text-lg">
                  ${parseFloat(selectedOrder.total || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              {selectedOrder.status === 'created' && (
                <>
                  <Button
                    variant="success"
                    fullWidth
                    onClick={() => {
                      handleAcceptOrder(selectedOrder.id);
                      setShowOrderDetail(false);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aceptar Pedido
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      handleCancelOrder(selectedOrder.id);
                      setShowOrderDetail(false);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </>
              )}
              {selectedOrder.status === 'accepted_by_store' && (
                <Button
                  variant="success"
                  fullWidth
                  onClick={() => {
                    handleMarkReady(selectedOrder.id);
                    setShowOrderDetail(false);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar como Listo
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </StoreLayout>
  );
};

export default Orders;
