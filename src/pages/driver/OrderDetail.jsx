import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import DriverLayout from '../../components/layouts/DriverLayout';
import { Button } from '../../components/common';
import toast from 'react-hot-toast';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(id, name, logo_url, address, phone),
          client:profiles!orders_client_id_fkey(id, full_name, phone),
          items:order_items(
            id,
            quantity,
            unit_price,
            product_name
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Error al cargar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Estado actualizado exitosamente');
      setOrder(prev => ({ ...prev, status: newStatus }));

      if (newStatus === 'delivered') {
        navigate('/driver/orders');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  const getNextAction = () => {
    const statusActions = {
      driver_heading_to_store: { label: 'Marcar como Recogido', next: 'picked_up', icon: '📦' },
      picked_up: { label: 'Iniciar Entrega', next: 'driver_heading_to_client', icon: '🚗' },
      driver_heading_to_client: { label: 'Marcar como Entregado', next: 'delivered', icon: '✅' },
    };
    return statusActions[order?.status] || null;
  };

  if (loading) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DriverLayout>
    );
  }

  if (!order) {
    return (
      <DriverLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Pedido no encontrado</p>
          <Button onClick={() => navigate('/driver/orders')} className="mt-4">
            Ver pedidos
          </Button>
        </div>
      </DriverLayout>
    );
  }

  const nextAction = getNextAction();

  return (
    <DriverLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detalle del pedido</h1>
              <p className="text-gray-500">Pedido #{order.id.slice(0, 8)}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/driver/orders')}
            >
              ← Volver
            </Button>
          </div>
        </div>

        {/* Store Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📍 Recoger en</h2>
          <div className="flex items-start gap-4">
            <img
              src={order.store.logo_url || 'https://via.placeholder.com/80'}
              alt={order.store.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{order.store.name}</p>
              <p className="text-sm text-gray-500 mt-1">{order.store.address}</p>
              <p className="text-sm text-gray-500">{order.store.phone}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.store.address)}`)}
            >
              Ver mapa
            </Button>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🏠 Entregar a</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Cliente</p>
              <p className="font-medium text-gray-900">{order.client.full_name}</p>
              <p className="text-sm text-gray-500">{order.client.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dirección de entrega</p>
              <p className="font-medium text-gray-900">{order.delivery_address}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`)}
            >
              Ver mapa
            </Button>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📦 Productos</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.product_name}</p>
                  <p className="text-sm text-gray-500">x{item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-900">
                  ${(item.unit_price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 Resumen</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Costo de envío</span>
              <span>${order.delivery_cost.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento</span>
                <span>-${order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total a cobrar</span>
                <span>${order.total.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 mt-3">
              <p className="text-sm font-medium text-blue-900">
                Método de pago: {order.payment_method === 'cash' ? '💵 Efectivo' : '🏦 Transferencia'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {nextAction && (
          <Button
            onClick={() => updateOrderStatus(nextAction.next)}
            loading={updating}
            className="w-full py-4 text-lg"
          >
            {nextAction.icon} {nextAction.label}
          </Button>
        )}
      </div>
    </DriverLayout>
  );
};

export default OrderDetail;
