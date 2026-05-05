import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../components/layouts/ClientLayout';
import { Card, Button, LoadingSpinner } from '../../components/common';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import useCart from '../../hooks/useCart';
import { validateCoverage } from '../../lib/coverageHelper';
import AddressModal from '../../components/common/AddressModal';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [zones, setZones] = useState([]);
  const [storeData, setStoreData] = useState(null);
  const [deliveryTier, setDeliveryTier] = useState(null); 
  const [deliveryMethod, setDeliveryMethod] = useState(''); 
  const [coverageMsg, setCoverageMsg] = useState('');
  const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState(0);

  const subtotal = getTotalPrice();
  const finalDeliveryFee = (isFirstOrder && subtotal >= 5000) ? 0 : dynamicDeliveryFee;
  const total = subtotal + finalDeliveryFee;

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
    fetchUserDataAndLogistics();
  }, []);

  useEffect(() => {
    if (selectedAddress && storeData && zones.length > 0) {
      const clientLoc = { lat: selectedAddress.latitude || 8.9167, lng: selectedAddress.longitude || -75.1833 };
      const storeLoc = { lat: storeData.latitude || 8.9167, lng: storeData.longitude || -75.1833 };

      const clientCoverage = validateCoverage(clientLoc, zones);
      const storeCoverage = validateCoverage(storeLoc, zones);

      if (clientCoverage.available) {
        if (storeCoverage.available && clientCoverage.zone.id === storeCoverage.zone.id) {
          setDeliveryTier(1);
          setDeliveryMethod('express');
          setDynamicDeliveryFee(clientCoverage.zone.base_delivery_cost || 2000);
          setCoverageMsg('Envío Local Express');
        } else {
          setDeliveryTier(2);
          setDeliveryMethod('encargo'); 
          setDynamicDeliveryFee(0);
          setCoverageMsg('Envío Intermunicipal disponible');
        }
      } else {
        setDeliveryTier(3);
        setDeliveryMethod('certified');
        setDynamicDeliveryFee(0);
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

      const { data: addressData } = await supabase
        .from('client_addresses')
        .select('*')
        .eq('client_id', user.id)
        .order('is_default', { ascending: false });

      setAddresses(addressData || []);
      if (addressData && addressData.length > 0) {
        setSelectedAddress(addressData.find(a => a.is_default) || addressData[0]);
      }

      const storeId = cartItems[0].store_id;
      const { data: sData } = await supabase
        .from('stores')
        .select('id, name, latitude, longitude, phone')
        .eq('id', storeId)
        .single();
      setStoreData(sData);

      const { data: zData } = await supabase.from('coverage_zones').select('*').eq('is_active', true);
      setZones(zData || []);

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

  const handleSaveAddressFromModal = async (formData, editId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user session');

      if (formData.is_default) {
        await supabase.from('client_addresses').update({ is_default: false }).eq('client_id', user.id);
      }

      const addressPayload = { ...formData, client_id: user.id };

      let res;
      if (editId) {
        res = await supabase.from('client_addresses').update(addressPayload).eq('id', editId);
      } else {
        res = await supabase.from('client_addresses').insert([addressPayload]);
      }

      if (res.error) throw res.error;

      toast.success(editId ? 'Dirección actualizada' : 'Dirección guardada');
      setShowAddressModal(false);
      setEditingAddress(null);
      fetchUserDataAndLogistics(); 
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Error al guardar la dirección');
    }
  };

  const handleConfirmOrderAndWhatsApp = async () => {
    if (!selectedAddress) {
      toast.error('Por favor, indica tu dirección en el mapa.');
      return;
    }

    if (!storeData?.phone) {
      toast.error('La tienda no tiene un número de WhatsApp configurado para recibir cotizaciones.');
      return;
    }

    try {
      setProcessing(true);
      const { data: { user } } = await supabase.auth.getUser();

      const deliveryPin = deliveryMethod !== 'certified' 
        ? Math.floor(1000 + Math.random() * 9000).toString() 
        : null;

      const orderNumber = 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase();

      const orderData = {
        client_id: user.id,
        store_id: cartItems[0].store_id,
        total: total,
        subtotal: subtotal,
        delivery_cost: finalDeliveryFee,
        discount: 0,
        status: 'created',
        delivery_address: selectedAddress.address_line,
        delivery_latitude: selectedAddress.latitude,
        delivery_longitude: selectedAddress.longitude,
        payment_method: 'cash',
        order_number: orderNumber,
        delivery_instructions: notes || '',
        delivery_tier: deliveryTier,
        delivery_type: deliveryMethod,
        delivery_pin: deliveryPin
      };

      const { data: order, error: orderError } = await supabase.from('orders').insert(orderData).select().single();
      if (orderError) throw orderError;

      const orderItemsData = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      await supabase.from('order_items').insert(orderItemsData);

      // --- GENERACIÓN DEL MENSAJE DE WHATSAPP ---
      let itemsText = cartItems.map(item => `▫️ ${item.quantity}x *${item.name}* ($${(item.price * item.quantity).toLocaleString()})`).join('\n');
      
      let deliveryInfoText = deliveryMethod === 'express' 
        ? `Envío Express: $${finalDeliveryFee.toLocaleString()}`
        : deliveryMethod === 'encargo' 
          ? `Envío: Encargo Rutero (A convenir)`
          : `Envío: Mensajería Certificada (A convenir)`;

      const googleMapsLink = `https://maps.google.com/maps?q=${selectedAddress.latitude},${selectedAddress.longitude}`;

      // Mensaje hermosamente identado con saltos de línea y emojis
      const message = `Hola *${storeData.name}* 👋
Vengo de la *App Galeras* y me gustaría solicitar este pedido (Orden: #${orderNumber}):

🛍️ *MIS PRODUCTOS:*
${itemsText}

📊 *RESUMEN:*
Subtotal: $${subtotal.toLocaleString()}
${deliveryInfoText}
*TOTAL ESTIMADO: $${total.toLocaleString()}*

📍 *MI UBICACIÓN:*
Dirección: ${selectedAddress.address_name} - ${selectedAddress.address_line}
Notas: ${notes || 'Ninguna'}
🗺️ Ver en mapa: ${googleMapsLink}

¿Me confirmas disponibilidad y método de pago, por favor? 🙏`;

      // Formateo inteligente del número de teléfono (remueve caracteres raros y asegura el código 57 si es de Colombia)
      let storePhone = storeData.phone.replace(/\D/g, '');
      if (storePhone.length === 10) {
        storePhone = `57${storePhone}`;
      }

      const whatsappUrl = `https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`;

      clearCart();
      window.open(whatsappUrl, '_blank');
      navigate(`/orders/${order.id}`);

    } catch (error) {
      console.error('Error procesando pedido:', error);
      toast.error('Ocurrió un error al procesar tu cotización.');
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
            <span className="font-medium">← Volver a mi cotización</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Revisar Cotización</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            <Card padding="md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📍 ¿A dónde quieres que te enviemos?</h2>
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
                          {address.instructions && <p className="text-xs text-gray-500 mt-1">{address.instructions}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 text-center">
                    <button onClick={() => { setEditingAddress(null); setShowAddressModal(true); }} className="text-sm font-semibold text-blue-600 underline">
                      + Agregar otra dirección con el mapa
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Necesitamos tu ubicación exacta para cotizar tu envío.</p>
                  <Button onClick={() => { setEditingAddress(null); setShowAddressModal(true); }}>Abrir Mapa</Button>
                </div>
              )}
            </Card>

            {selectedAddress && deliveryTier && (
              <Card padding="md" className="border-blue-100 bg-blue-50/30">
                <h2 className="text-xl font-bold text-gray-900 mb-2">🚚 Logística Asignada</h2>
                <p className="text-sm text-gray-600 mb-4">{coverageMsg}</p>
                
                <div className="space-y-3">
                  {deliveryTier === 1 && (
                    <div className="p-4 border-2 border-blue-600 bg-blue-50 rounded-xl">
                      <span className="block font-semibold text-gray-900">Envío Local Express</span>
                      <span className="block text-sm text-gray-500">Repartidor local. Costo estimado: ${finalDeliveryFee.toLocaleString()}</span>
                    </div>
                  )}

                  {deliveryTier === 2 && (
                    <>
                      <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer ${deliveryMethod === 'encargo' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                        <input type="radio" checked={deliveryMethod === 'encargo'} onChange={() => setDeliveryMethod('encargo')} className="mt-1 w-4 h-4 text-blue-600" />
                        <div className="ml-3">
                          <span className="block font-semibold text-gray-900">Encargo Rutero</span>
                          <span className="block text-sm text-gray-500">Sujeto a vehículos en ruta.</span>
                        </div>
                      </label>
                      <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer ${deliveryMethod === 'certified' ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white'}`}>
                        <input type="radio" checked={deliveryMethod === 'certified'} onChange={() => setDeliveryMethod('certified')} className="mt-1 w-4 h-4 text-green-600" />
                        <div className="ml-3">
                          <span className="block font-semibold text-gray-900">Mensajería Certificada</span>
                          <span className="block text-sm text-gray-500">Más seguro, flete a convenir con la tienda.</span>
                        </div>
                      </label>
                    </>
                  )}

                  {deliveryTier === 3 && (
                    <div className="p-4 border-2 border-green-600 bg-green-50 rounded-xl">
                      <span className="block font-semibold text-gray-900">Mensajería Certificada</span>
                      <span className="block text-sm text-gray-500">Se enviará por servicio de encomienda externa.</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card padding="md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Notas al comercio</h2>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 border rounded-xl" placeholder="Ej: Sin cebolla, o dejar en portería..." />
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card padding="md" className="sticky top-20 border-green-200">
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
              </div>
              
              <div className="flex justify-between text-xl font-bold text-gray-900 mb-6">
                <span>Total Estimado</span>
                <span>${total.toLocaleString()}</span>
              </div>

              <button 
                onClick={handleConfirmOrderAndWhatsApp} 
                disabled={!selectedAddress || processing}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {processing ? (
                  'Generando Orden...'
                ) : (
                  <>
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    Cotizar por WhatsApp
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-4">
                No pagas nada aquí. El pago y la entrega lo acuerdas directo con la tienda por WhatsApp.
              </p>
            </Card>
          </div>
        </div>
      </div>

      <AddressModal 
        isOpen={showAddressModal} 
        onClose={() => {
          setShowAddressModal(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddressFromModal}
        editingAddress={editingAddress}
      />
      
    </ClientLayout>
  );
};

export default Checkout;