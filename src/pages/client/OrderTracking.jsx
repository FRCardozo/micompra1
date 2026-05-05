import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ClientLayout from '../../components/layouts/ClientLayout';
import { Button, Modal, Rating } from '../../components/common';
import toast from 'react-hot-toast';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadOrder();

    // Subscribe to order updates
    const channel = supabase
      .channel(`order:${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        setOrder(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(id, name, logo_url),
          driver:delivery_drivers!orders_driver_id_fkey(id, profiles!delivery_drivers_id_fkey(id, full_name, phone)),
          items:order_items(
            id,
            quantity,
            unit_price,
            product_name,
            product_image_url
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

  const handleOpenRating = () => {
    if (!order) return;
    setRating(order.client_rating || 5);
    setComment(order.client_comment || '');
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    try {
      if (!order) return;

      if (!rating || rating < 1) {
        toast.error('Selecciona una calificación');
        return;
      }

      const payload = {
        order_id: order.id,
        store_id: order.store?.id,
        rating,
        comment: comment.trim() || null,
      };

      const { error } = await supabase
        .from('order_ratings')
        .insert(payload);

      if (error) throw error;

      toast.success('¡Gracias por calificar tu pedido!');
      setShowRatingModal(false);
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('No se pudo guardar la calificación');
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      created: { label: 'Creado', color: 'bg-gray-500', icon: '📝' },
      accepted_by_store: { label: 'Aceptado', color: 'bg-blue-500', icon: '✓' },
      assigned_to_driver: { label: 'Repartidor asignado', color: 'bg-indigo-500', icon: '🛵' },
      picked_up: { label: 'Recogido', color: 'bg-purple-500', icon: '📦' },
      delivered: { label: 'Entregado', color: 'bg-green-600', icon: '✅' },
      cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: '❌' },
    };
    return statusMap[status] || statusMap.pending;
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ClientLayout>
    );
  }

  if (!order) {
    return (
      <ClientLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Pedido no encontrado</p>
          <Button onClick={() => navigate('/orders')} className="mt-4">
            Ver mis pedidos
          </Button>
        </div>
      </ClientLayout>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Seguimiento del pedido</h1>
            <span className={`${statusInfo.color} text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2`}>
              <span>{statusInfo.icon}</span>
              <span>{statusInfo.label}</span>
            </span>
          </div>
          <p className="text-gray-500">Pedido #{order.id.slice(0, 8)}</p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Estado del pedido</h2>
          <div className="space-y-4">
            {['created', 'accepted_by_store', 'assigned_to_driver', 'picked_up', 'delivered'].map((status, index) => {
              const info = getStatusInfo(status);
              const isActive = order.status === status;
              const isPast = ['created', 'accepted_by_store', 'assigned_to_driver', 'picked_up', 'delivered'].indexOf(order.status) > index;

              return (
                <div key={status} className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isActive || isPast ? info.color : 'bg-gray-200'
                    } text-white font-semibold`}>
                    {info.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isActive || isPast ? 'text-gray-900' : 'text-gray-400'}`}>
                      {info.label}
                    </p>
                  </div>
                  {isActive && (
                    <div className="animate-pulse">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Store Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del negocio</h2>
          <div className="flex items-center gap-4">
            <img
              src={order.store.image_url || 'https://via.placeholder.com/80'}
              alt={order.store.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div>
              <p className="font-semibold text-gray-900">{order.store.name}</p>
              <p className="text-sm text-gray-500">Dirección de entrega: {order.delivery_address}</p>
            </div>
          </div>
        </div>

        {/* Driver Info */}
        {order.driver?.profiles && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Repartidor</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🛵</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{order.driver.profiles.full_name}</p>
                <p className="text-sm text-gray-500">{order.driver.profiles.phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {item.product_image_url ? (
                    <img
                      src={item.product_image_url}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
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
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
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
                <span>Total</span>
                <span>${order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/orders')}
            className="flex-1"
          >
            Ver todos mis pedidos
          </Button>
          {order.status === 'delivered' && (
            <Button
            onClick={handleOpenRating}
              className="flex-1"
            >
              Calificar pedido
            </Button>
          )}
        </div>

        {/* Rating Modal */}
        <Modal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          title="Calificar pedido"
        >
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-gray-600">¿Cómo estuvo tu experiencia?</p>
              <Rating
                value={rating}
                onChange={setRating}
                size="lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentarios (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cuéntanos qué estuvo bien o qué podemos mejorar..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRatingModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitRating}
              >
                Enviar calificación
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ClientLayout>
  );
};

export default OrderTracking;
