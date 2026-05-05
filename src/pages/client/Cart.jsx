import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../components/layouts/ClientLayout';
import { Card, Button, EmptyState } from '../../components/common';
import { useCartContext } from '../../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import { Trash2, MapPin, Store as StoreIcon, MessageCircle, Truck, Wallet, Banknote, CreditCard, Navigation, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCartContext();
  
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [storePhone, setStorePhone] = useState('');
  
  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [address, setAddress] = useState('');
  const [mapLink, setMapLink] = useState(''); 
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    checkFirstOrder();
    fetchStorePhone();
  }, [cartItems]);

  const checkFirstOrder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count, error } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('client_id', user.id);
      if (!error) setIsFirstOrder(count === 0);
    } catch (error) {
      console.error('Error checking first order:', error);
    }
  };

  const fetchStorePhone = async () => {
    if (cartItems.length > 0) {
      const storeId = cartItems[0].store_id;
      if (storeId) {
        const { data } = await supabase.from('stores').select('phone').eq('id', storeId).single();
        if (data?.phone) setStorePhone(data.phone);
      }
    }
  };

  const subtotal = getTotalPrice();
  const deliveryFee = (cartItems.length > 0 && !(isFirstOrder && subtotal >= 5000)) ? 2000 : 0;
  const total = deliveryMethod === 'pickup' ? subtotal : subtotal + deliveryFee;

  const handleUpdateQuantity = (productId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
    toast.success('Producto removido');
  };

  const handleClearCart = () => {
    if (window.confirm('¿Estás seguro de que deseas vaciar tu lista?')) clearCart();
  };

  // LINK DE MAPS CORREGIDO
  const handleGetLocation = () => {
    if (!navigator.geolocation) return toast.error("Tu dispositivo no soporta ubicación GPS.");
    setIsGettingLocation(true);
    const loadingToast = toast.loading("Calculando ubicación exacta...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        // Ahora sí, un link de Google Maps real y clickeable
        setMapLink(`https://www.google.com/maps?q=${lat},${lng}`);
        toast.success("¡Ubicación capturada con éxito!", { id: loadingToast });
        setIsGettingLocation(false);
      },
      (error) => {
        toast.error("Activa tu GPS o dale permisos al navegador.", { id: loadingToast });
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // EL MOTOR DE WHATSAPP: Exactamente el formato que pediste
  const handleSendWhatsApp = () => {
    if (!storePhone) return toast.error("La tienda no tiene un WhatsApp registrado.");
    if (deliveryMethod === 'delivery' && !address.trim() && !mapLink) {
      return toast.error("Por favor ingresa tu dirección o usa el GPS.");
    }

    let message = `¡Hola! 👋 Te escribo desde la App para solicitar este pedido:\n\n`;

    cartItems.forEach(item => {
      message += `🛍️ ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toLocaleString()}\n`;
    });

    message += `\n📍 *Entrega:* ${deliveryMethod === 'delivery' ? 'A domicilio' : 'Recoger en local'}\n`;
    
    if (deliveryMethod === 'delivery') {
      if (address) message += `🏠 *Dirección:* ${address}\n`;
      if (mapLink) message += `🗺️ *Mapa GPS:* ${mapLink}\n`;
    }

    message += `💵 *Pago:* ${paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia / Nequi'}`;
    if (paymentMethod === 'cash' && cashAmount) {
      message += ` (Pago con: ${cashAmount})`;
    }
    message += `\n`;
    
    if (notes.trim()) {
      message += `📝 *Notas adicionales:* ${notes}\n`;
    }

    message += `\nTotal aprox: $${total.toLocaleString()} ${deliveryMethod === 'delivery' && deliveryFee > 0 ? '(*Incluye envío*)' : ''}\n\n`;
    message += `¡Quedo atento a la confirmación! 🚀`;

    const cleanPhone = storePhone.replace(/\D/g, '');
    window.open(`https://wa.me/57${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    
    clearCart();
    navigate('/client');
    setTimeout(() => {
      toast.success("¡Tu pedido fue enviado al comercio!", { duration: 4000, icon: '🎉' });
    }, 500);
  };

  const itemsByStore = cartItems.reduce((acc, item) => {
    const storeName = item.store_name || 'Comercio';
    if (!acc[storeName]) acc[storeName] = [];
    acc[storeName].push(item);
    return acc;
  }, {});

  if (cartItems.length === 0) {
    return (
      <ClientLayout>
        <EmptyState icon={ShoppingCart} title="Tu carrito está vacío" message="Explora nuestras tiendas aliadas y encuentra lo que necesitas." />
        <div className="flex justify-center mt-6">
          <Button onClick={() => navigate('/client/stores')}>Explorar comercios</Button>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Mi Cotización</h1>
            <p className="text-gray-500 mt-1 font-medium">{cartItems.length} {cartItems.length === 1 ? 'producto listo' : 'productos listos'}</p>
          </div>
          <button onClick={handleClearCart} className="text-red-500 text-sm font-bold bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors">
            Vaciar lista
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-4">
            {Object.entries(itemsByStore).map(([storeName, items]) => (
              <div key={storeName} className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center"><StoreIcon className="w-5 h-5"/></div>
                  <h2 className="text-xl font-black text-gray-900">{storeName}</h2>
                </div>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50/50 hover:bg-gray-50 rounded-2xl transition-colors border border-gray-100">
                      
                      <div className="w-20 h-20 bg-white rounded-xl shadow-sm overflow-hidden shrink-0">
                        {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-bold text-gray-900 truncate pr-2">{item.name}</h3>
                          <p className="text-orange-500 font-black text-sm">${item.price?.toLocaleString()}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 shadow-sm" disabled={item.quantity <= 1}>-</button>
                          <span className="font-black text-gray-900 w-4 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 shadow-sm">+</button>
                        </div>
                      </div>

                      <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500 p-3 hover:bg-red-50 rounded-xl shrink-0 transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 sticky top-24">
              <h2 className="text-xl font-black text-gray-900 mb-6">Detalles del Envío</h2>

              <div className="space-y-3 mb-6">
                <label className="text-sm font-bold text-gray-700">¿Cómo lo quieres recibir?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setDeliveryMethod('delivery')} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${deliveryMethod === 'delivery' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}><Truck className="w-4 h-4"/> Domicilio</button>
                  <button onClick={() => setDeliveryMethod('pickup')} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${deliveryMethod === 'pickup' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}><StoreIcon className="w-4 h-4"/> Recoger</button>
                </div>
              </div>

              {deliveryMethod === 'delivery' && (
                <div className="space-y-3 mb-6 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-gray-400"/> Dirección de entrega</span>
                    <button 
                      onClick={handleGetLocation} 
                      disabled={isGettingLocation}
                      className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"
                    >
                      <Navigation className="w-3 h-3" /> {mapLink ? 'Ubicación guardada' : 'Usar mi GPS'}
                    </button>
                  </label>
                  
                  <input 
                    type="text" 
                    placeholder="Ej: Barrio El Centro, Calle 4 #12-34" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white transition-all"
                  />
                  {mapLink && (
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1 bg-green-50 p-2 rounded-lg border border-green-100">
                      ✅ Se adjuntará un mapa exacto para el domiciliario.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3 mb-6">
                <label className="text-sm font-bold text-gray-700">Método de Pago</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPaymentMethod('cash')} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${paymentMethod === 'cash' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}><Banknote className="w-4 h-4"/> Efectivo</button>
                  <button onClick={() => setPaymentMethod('transfer')} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${paymentMethod === 'transfer' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}><CreditCard className="w-4 h-4"/> Transferencia</button>
                </div>
                {paymentMethod === 'cash' && (
                  <input 
                    type="text" 
                    placeholder="¿Con qué billete pagas? (Para el vuelto)" 
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full mt-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:bg-white transition-all animate-in fade-in"
                  />
                )}
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-sm font-bold text-gray-700">Notas adicionales (Opcional)</label>
                <textarea 
                  placeholder="Ej: Talla M, Color rojo, Sin cebolla..." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:bg-white transition-all"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl mb-6 space-y-3 border border-gray-100">
                <div className="flex justify-between text-gray-600 text-sm font-medium">
                  <span>Subtotal productos</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                {deliveryMethod === 'delivery' && (
                  <div className="flex justify-between text-gray-600 text-sm font-medium">
                    <span>Costo de envío (Aprox)</span>
                    <span className={deliveryFee === 0 ? "text-green-500 font-bold" : ""}>
                      {deliveryFee === 0 ? 'Gratis' : `$${deliveryFee.toLocaleString()}`}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total a pagar</span>
                  <span className="text-2xl font-black text-gray-900">${total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleSendWhatsApp}
                disabled={cartItems.length === 0}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black py-4 rounded-2xl shadow-[0_10px_25px_rgba(37,211,102,0.3)] flex justify-center items-center gap-2 active:scale-95 transition-all transform hover:-translate-y-1 text-lg"
              >
                <MessageCircle className="w-6 h-6 fill-current"/>
                ENVIAR PEDIDO AHORA
              </button>
              <p className="text-center text-xs text-gray-400 mt-4 font-medium">
                Al hacer clic, se abrirá un chat directo con el comercio.
              </p>

            </div>
          </div>

        </div>
      </div>
    </ClientLayout>
  );
};

export default Cart;