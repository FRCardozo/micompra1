import { useState, useEffect } from 'react';
import StoreLayout from '../../components/layouts/StoreLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, Smartphone, AlertCircle, ArrowRight, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const Orders = () => {
  const { profile } = useAuth();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      supabase.from('stores').select('*').eq('owner_id', profile.id).single()
        .then(({ data }) => {
          setStore(data);
          setLoading(false);
        });
    }
  }, [profile]);

  if (loading) return <StoreLayout><div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div></StoreLayout>;

  return (
    <StoreLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Recepción de Pedidos</h1>
          <p className="text-gray-500 text-sm">Gestiona tus ventas directamente desde tu celular.</p>
        </div>

        {/* Tarjeta de Explicación de la Fase 1 */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
            <MessageCircle className="w-48 h-48" />
          </div>
          
          <div className="relative z-10">
            <div className="bg-white/20 inline-flex p-3 rounded-2xl mb-6 backdrop-blur-sm">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black mb-2">Pedidos 100% por WhatsApp</h2>
            <p className="text-green-50 text-lg max-w-xl mb-8 leading-relaxed">
              En esta etapa de la plataforma, hemos simplificado el proceso para ti. No necesitas estar pendiente de esta pantalla para aceptar pedidos. 
              <strong> ¡Tus clientes armarán su carrito y te enviarán su pedido listo directamente a tu WhatsApp!</strong>
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-black/10 backdrop-blur-md rounded-2xl p-4">
                <div className="font-black text-2xl mb-1">1</div>
                <p className="text-sm font-medium text-green-50">El cliente navega tu catálogo y ofertas.</p>
              </div>
              <div className="bg-black/10 backdrop-blur-md rounded-2xl p-4">
                <div className="font-black text-2xl mb-1">2</div>
                <p className="text-sm font-medium text-green-50">Agrega productos al carrito de la app.</p>
              </div>
              <div className="bg-black/10 backdrop-blur-md rounded-2xl p-4">
                <div className="font-black text-2xl mb-1">3</div>
                <p className="text-sm font-medium text-green-50">Toca "Comprar" y te llega un mensaje listo a WhatsApp.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verificación del Número de WhatsApp */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${store?.phone ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Tu número de WhatsApp configurado</h3>
              {store?.phone ? (
                <p className="text-xl font-black text-green-600 mt-1">{store.phone}</p>
              ) : (
                <p className="text-sm font-medium text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4"/> No tienes un número configurado
                </p>
              )}
            </div>
          </div>
          
          <Link to="/store/profile" className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md">
            <Settings className="w-5 h-5"/> Configurar Número
          </Link>
        </div>

        {/* Nota sobre el futuro */}
        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 flex items-start gap-4">
          <div className="bg-purple-100 p-2 rounded-lg shrink-0">
            <AlertCircle className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h4 className="font-bold text-purple-900">¿Y el panel de control de repartidores?</h4>
            <p className="text-sm text-purple-700 mt-1">
              La gestión logística (donde asignas repartidores en tiempo real dentro de la app) se activará automáticamente en la <strong>Fase 2</strong> de la plataforma. Por ahora, concéntrate en vender y atender a tus clientes rápidamente por WhatsApp.
            </p>
          </div>
        </div>

      </div>
    </StoreLayout>
  );
};

export default Orders;