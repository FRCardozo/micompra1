import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../components/layouts/ClientLayout';
import { Card, Button, Input, LoadingSpinner } from '../../components/common';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import useCart from '../../hooks/useCart';
import { validateCoverage } from '../../lib/coverageHelper';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    address_name: '',
    address_line: '',
    instructions: '',
    is_default: false,
    // CRÍTICO: Debes agregar esto a tu UI del modal luego
    latitude: null, 
    longitude: null
  });
  const [addrLoading, setAddrLoading] = useState(false);

  // --- NUEVOS ESTADOS DE LOGÍSTICA ---
  const [zones, setZones] = useState([]);
  const [storeData, setStoreData] = useState(null);
  const [deliveryTier, setDeliveryTier] = useState(null); // 1, 2, o 3
  const [deliveryMethod, setDeliveryMethod] = useState(''); // 'express', 'encargo', 'certified'
  const [coverageMsg, setCoverageMsg] = useState('');
  const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState(0);

  const subtotal = getTotalPrice();
  const discount = appliedCoupon ? (subtotal * appliedCoupon.discount) / 100 : 0;
  
  // El costo de envío ahora es dinámico
  const finalDeliveryFee = (isFirstOrder && subtotal >= 5000) ? 0 : dynamicDeliveryFee;
  const total = subtotal + finalDeliveryFee - discount;

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
    fetchUserDataAndLogistics();
  }, []);

  // --- EVALUADOR DE LOS 3 NIVELES LOGÍSTICOS ---
  useEffect(() => {
    if (selectedAddress && storeData && zones.length > 0) {
      // NOTA: Si la dirección no tiene lat/lng en BD, usamos el centro de Galeras como fallback temporal
      const clientLat = selectedAddress.latitude || 8.9167;
      const clientLng = selectedAddress.longitude || -75.1833;
      
      const clientLoc = { lat: clientLat, lng: clientLng };
      const storeLoc = { lat: storeData.latitude || 8.9167, lng: storeData.longitude || -75.1833 };

      const clientCoverage = validateCoverage(clientLoc, zones);
      const storeCoverage = validateCoverage(storeLoc, zones);

      if (clientCoverage.available) {
        if (storeCoverage.available && clientCoverage.zone.id === storeCoverage.zone.id) {
          // NIVEL 1: Mismo polígono (Local)
          setDeliveryTier(1);
          setDeliveryMethod('express');
          setDynamicDeliveryFee(clientCoverage.zone.base_delivery_cost || 2000);
          setCoverageMsg('Envío Local Express');
        } else {
          // NIVEL 2: Polígonos distintos (Intermunicipal)
          setDeliveryTier(2);
          setDeliveryMethod('encargo'); // Opción por defecto, el usuario puede cambiarla a 'certified'
          setDynamicDeliveryFee(0); // A convenir
          setCoverageMsg('Envío Intermunicipal disponible');
        }
      } else {
        // NIVEL 3: Cliente fuera de mapa (Nacional)
        setDeliveryTier(3);
        setDeliveryMethod('certified');
        setDynamicDeliveryFee(0); // Flete contra entrega
        setCoverageMsg('Fuera de zona express. Solo Mensajería Certificada.');
      }
    }
  }, [selectedAddress, storeData, zones]);

  const fetchUserDataAndLogistics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/auth/login');
        return;
      }

      // 1. Fetch Addresses
      const { data: addressData } = await supabase
        .from('client_addresses')
        .select('*')
        .eq('client_id', user.id)
        .order('is_default', { ascending: false });

      setAddresses(addressData || []);
      if (addressData && addressData.length > 0) {
        setSelectedAddress(addressData.find(a => a.is_default) || addressData[0]);
      }

      // 2. Fetch Store Location (Crítico para calcular rutas)
      const storeId = cartItems[0].store_id;
      const { data: sData } = await supabase
        .from('stores')
        .select('id, latitude, longitude')
        .eq('id', storeId)
        .single();
      setStoreData(sData);

      // 3. Fetch Coverage Zones activas
      const { data: zData } = await supabase
        .from('coverage_zones')
        .select('*')
        .eq('is_active', true);
      setZones(zData || []);

      // 4. Check First Order
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', user.id);
      setIsFirstOrder(orderCount === 0);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddrLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user session');

      if (addressForm.is_default) {
        await supabase.from('client_addresses').update({ is_default: false }).eq('client_id', user.id);
      }

      // FIX TEMPORAL: Insertando Galeras por defecto si no hay mapa
      const addressPayload = {
        ...addressForm,
        client_id: user.id,
        latitude: addressForm.latitude || 8.9167,
        longitude: addressForm.longitude || -75.1833
      };

      let res;
      if (editingAddress) {
        res = await supabase.from('client_addresses').update(addressPayload).eq('id', editingAddress.id);
      } else {
        res = await supabase.from('client_addresses').insert([addressPayload]);
      }

      if (res.error) throw res.error;

      toast.success(editingAddress ? 'Dirección actualizada' : 'Dirección guardada');
      setShowAddressModal(false);
      setEditingAddress(null);
      setAddressForm({ address_name: '', address_line: '', instructions: '', is_default: false, latitude: null, longitude: null });
      fetchUserDataAndLogistics();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Error al guardar la dirección');
    } finally {
      setAddrLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .single();

      if (error || !data) {
        toast.error('Cupón inválido o expirado');
        return;
      }

      setAppliedCoupon(data);
      toast.success(`¡Cupón aplicado! ${data.discount}% de descuento`);
    } catch (error) {
      toast.error('Error al aplicar el cupón');
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedAddress || !selectedPaymentMethod) {
      toast.error('Selecciona dirección y método de pago');
      return;
    }

    try {
      setProcessing(true);
      const { data: { user } } = await supabase.auth.getUser();

      // PIN de Seguridad de 4 dígitos solo si NO es mensajería certificada
      const deliveryPin = deliveryMethod !== 'certified' 
        ? Math.floor(1000 + Math.random() * 9000).toString() 
        : null;

      const orderData = {
        client_id: user.id,
        store_id: cartItems[0].store_id,
        total: total,
        subtotal: subtotal,
        delivery_cost: finalDeliveryFee,
        discount: discount,
        status: 'created',
        delivery_address: selectedAddress.address_line,
        // Usamos las coordenadas reales de la dirección seleccionada
        delivery_latitude: selectedAddress.latitude || 8.9167,
        delivery_longitude: selectedAddress.longitude || -75.1833,
        payment_method: selectedPaymentMethod.type,
        order_number: 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        delivery_instructions: notes || '',
        coupon_id: appliedCoupon?.id || null,
        
        // NUEVAS COLUMNAS DE LÓGICA
        delivery_tier: deliveryTier,
        delivery_type: deliveryMethod, // 'express', 'encargo', 'certified'
        delivery_pin: deliveryPin
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItemsData = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_image_url: item.image_url,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
      if (itemsError) throw itemsError;

      await new Promise(resolve => setTimeout(resolve, 2000));
      clearCart();
      toast.success('¡Pedido realizado con éxito!');
      navigate(`/orders/${order.id}`);

    } catch (error) {
      console.error('Final Confirm Order Error:', error);
      toast.error('Error al confirmar pedido. Verifica la consola.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (<ClientLayout><div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div></ClientLayout>);

  return (
    <ClientLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <button onClick={() => navigate('/cart')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4">
            <span className="font-medium">← Volver al carrito</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Finalizar pedido</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. SELECCIÓN DE DIRECCIÓN */}
            <Card padding="md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Dirección de entrega</h2>
              {addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => setSelectedAddress(address)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress?.id === address.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{address.address_name}</p>
                          <p className="text-sm text-gray-600">{address.address_line}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={() => setShowAddressModal(true)}>Agregar dirección</Button>
                </div>
              )}
            </Card>

            {/* 2. MÉTODO DE ENVÍO (LÓGICA DE 3 NIVELES) */}
            {selectedAddress && deliveryTier && (
              <Card padding="md" className="border-blue-100 bg-blue-50/30">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Método de Envío</h2>
                <p className="text-sm text-gray-600 mb-4">{coverageMsg}</p>
                
                <div className="space-y-3">
                  {/* NIVEL 1: Solo Express */}
                  {deliveryTier === 1 && (
                    <label className="flex items-start p-4 border-2 border-blue-600 bg-blue-50 rounded-xl cursor-pointer">
                      <input type="radio" checked readOnly className="mt-1 w-4 h-4 text-blue-600" />
                      <div className="ml-3">
                        <span className="block font-semibold text-gray-900">Envío Local Express</span>
                        <span className="block text-sm text-gray-500">Entrega rápida por nuestra flota local.</span>
                      </div>
                    </label>
                  )}

                  {/* NIVEL 2: Encargo o Certificada */}
                  {deliveryTier === 2 && (
                    <>
                      <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer ${deliveryMethod === 'encargo' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                        <input type="radio" checked={deliveryMethod === 'encargo'} onChange={() => setDeliveryMethod('encargo')} className="mt-1 w-4 h-4 text-blue-600" />
                        <div className="ml-3">
                          <span className="block font-semibold text-gray-900">Encargo Rutero (Bolsa de Viajes)</span>
                          <span className="block text-sm text-gray-500">Un conductor en ruta llevará tu pedido. Costo a convenir.</span>
                        </div>
                      </label>
                      <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer ${deliveryMethod === 'certified' ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white'}`}>
                        <input type="radio" checked={deliveryMethod === 'certified'} onChange={() => setDeliveryMethod('certified')} className="mt-1 w-4 h-4 text-green-600" />
                        <div className="ml-3">
                          <span className="block font-semibold text-gray-900">Mensajería Certificada</span>
                          <span className="block text-sm text-gray-500">Inter Rapidísimo / Servientrega. Más seguro para larga distancia.</span>
                        </div>
                      </label>
                    </>
                  )}

                  {/* NIVEL 3: Solo Certificada */}
                  {deliveryTier === 3 && (
                    <label className="flex items-start p-4 border-2 border-green-600 bg-green-50 rounded-xl cursor-pointer">
                      <input type="radio" checked readOnly className="mt-1 w-4 h-4 text-green-600" />
                      <div className="ml-3">
                        <span className="block font-semibold text-gray-900">Mensajería Certificada (Inter Rapidísimo)</span>
                        <span className="block text-sm text-gray-500">La tienda te contactará para coordinar el pago del flete nacional.</span>
                      </div>
                    </label>
                  )}
                </div>
              </Card>
            )}

            {/* 3. MÉTODO DE PAGO */}
            <Card padding="md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Método de pago</h2>
              <div className="space-y-3">
                <div onClick={() => setSelectedPaymentMethod({ type: 'cash' })} className={`p-4 rounded-xl border-2 cursor-pointer ${selectedPaymentMethod?.type === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                  <p className="font-semibold text-gray-900">💵 Efectivo (Contra entrega)</p>
                </div>
                <div onClick={() => setSelectedPaymentMethod({ type: 'bank_transfer' })} className={`p-4 rounded-xl border-2 cursor-pointer ${selectedPaymentMethod?.type === 'bank_transfer' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                  <p className="font-semibold text-gray-900">📲 Transferencia (Nequi/Daviplata)</p>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Notas</h2>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 border rounded-xl" placeholder="Instrucciones especiales..." />
            </Card>
          </div>

          {/* RESUMEN LATERAL */}
          <div className="lg:col-span-1">
            <Card padding="md" className="sticky top-20">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen</h2>
              
              <div className="space-y-3 border-b pb-4 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span className="font-medium">{deliveryMethod === 'express' ? `$${finalDeliveryFee.toLocaleString()}` : 'A convenir'}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-${discount.toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between text-xl font-bold text-gray-900 mb-6">
                <span>Total estimado</span>
                <span>${total.toLocaleString()}</span>
              </div>

              <Button fullWidth size="lg" onClick={handleConfirmOrder} disabled={!selectedAddress || !selectedPaymentMethod || processing}>
                {processing ? 'Procesando...' : 'Confirmar pedido'}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default Checkout;