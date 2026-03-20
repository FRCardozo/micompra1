import React from 'react';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../components/layouts/ClientLayout';
import { Card, Button, EmptyState } from '../../components/common';
import useCart from '../../hooks/useCart';
import { supabase } from '../../lib/supabase';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const [isFirstOrder, setIsFirstOrder] = React.useState(false);

  React.useEffect(() => {
    checkFirstOrder();
  }, []);

  const checkFirstOrder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', user.id);

      if (!error) {
        setIsFirstOrder(count === 0);
      }
    } catch (error) {
      console.error('Error checking first order:', error);
    }
  };

  const subtotal = getTotalPrice();
  const deliveryFee = (cartItems.length > 0 && !(isFirstOrder && subtotal >= 5000)) ? 3000 : 0;
  const total = subtotal + deliveryFee;

  const handleUpdateQuantity = (productId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto de tu cotización?')) {
      removeFromCart(productId);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('¿Estás seguro de que deseas vaciar tu lista?')) {
      clearCart();
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    navigate('/checkout');
  };

  // Group items by store
  const itemsByStore = cartItems.reduce((acc, item) => {
    const storeName = item.store_name || 'Tienda';
    if (!acc[storeName]) {
      acc[storeName] = [];
    }
    acc[storeName].push(item);
    return acc;
  }, {});

  if (cartItems.length === 0) {
    return (
      <ClientLayout>
        <EmptyState
          icon="📝"
          title="Aún no tienes productos por cotizar"
          message="Explora nuestras tiendas aliadas y arma tu pedido"
        />
        <div className="flex justify-center mt-6">
          <Button onClick={() => navigate('/stores')}>
            Explorar tiendas
          </Button>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mi Cotización</h1>
            <p className="text-gray-600 mt-1">
              {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'} listos para solicitar
            </p>
          </div>
          {cartItems.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearCart}>
              Vaciar lista
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {Object.entries(itemsByStore).map(([storeName, items]) => (
              <Card key={storeName} padding="md">
                {/* Store Header */}
                <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-100">
                  <span className="text-2xl">🏪</span>
                  <h2 className="text-lg font-bold text-gray-900">{storeName}</h2>
                </div>

                {/* Store Items */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl"
                    >
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-3xl">📦</span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-grow">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-lg font-bold text-blue-600 mt-1">
                          ${item.price?.toLocaleString()}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="font-semibold text-gray-900 w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar producto"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card padding="md" className="sticky top-20">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen de Cotización</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Costo de envío aprox.</span>
                  <span className="font-medium">
                    {deliveryFee === 0 ? 'Gratis' : `$${deliveryFee.toLocaleString()}`}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Estimado</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
              >
                Revisar Cotización
              </Button>

              {/* Additional Info */}
              {isFirstOrder && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 text-xl">🚚</span>
                    <div>
                      <p className="text-sm text-blue-900 font-medium">
                        ¡Tu primer envío es GRATIS!
                      </p>
                      {subtotal < 5000 ? (
                        <p className="text-xs text-blue-700 mt-1">
                          Compra mínima de $5.000 para aplicar. Te faltan ${(5000 - subtotal).toLocaleString()}.
                        </p>
                      ) : (
                        <p className="text-xs text-green-700 mt-1 font-bold">
                          ¡Promoción aplicada! ✨
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('/stores')}
                className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                + Agregar más productos
              </button>
            </Card>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default Cart;