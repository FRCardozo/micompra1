import React, { useState, useEffect } from 'react';
import StoreLayout from '../../components/layouts/StoreLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Store, Clock, Zap, Plus, Power, X } from 'lucide-react';

const StoreDashboard = () => {
  const { profile } = useAuth();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [activeOffers, setActiveOffers] = useState([]);
  const [offerForm, setOfferForm] = useState({
    title: '', price: '', original_price: '', duration_hours: '24'
  });

  useEffect(() => {
    if (profile?.id) fetchStoreData();
  }, [profile]);

  const fetchStoreData = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', profile.id)
        .single();

      if (error) throw error;
      setStore(data);
      if (data) fetchActiveOffers(data.id);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOffers = async (storeId) => {
    try {
      const { data, error } = await supabase
        .from('flash_offers')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (!error) setActiveOffers(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleStoreStatus = async () => {
    if (!store) return;
    setUpdatingStatus(true);
    const newStatus = !store.is_open_now; 
    
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_open_now: newStatus })
        .eq('id', store.id);

      if (error) throw error;
      setStore({ ...store, is_open_now: newStatus });
      toast.success(newStatus ? '¡Tu negocio ahora está ABIERTO!' : 'Has cerrado tu negocio temporalmente.');
    } catch (error) {
      toast.error('Hubo un error al cambiar el estado.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!store) return;
    try {
      setUpdatingStatus(true);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(offerForm.duration_hours));

      const { data, error } = await supabase
        .from('flash_offers')
        .insert([{
          store_id: store.id,
          title: offerForm.title,
          price: parseFloat(offerForm.price),
          original_price: offerForm.original_price ? parseFloat(offerForm.original_price) : null,
          expires_at: expiresAt.toISOString(),
          is_active: true
        }])
        .select().single();

      if (error) throw error;
      toast.success('¡Oferta Flash publicada!');
      setShowOfferModal(false);
      setOfferForm({ title: '', price: '', original_price: '', duration_hours: '24' });
      setActiveOffers([data, ...activeOffers]);
    } catch (error) {
      toast.error('No se pudo publicar la oferta.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <StoreLayout><div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div></div></StoreLayout>;

  if (!store) return <StoreLayout><div className="text-center py-12"><Store className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h2 className="text-xl font-bold">No tienes tienda asignada</h2></div></StoreLayout>;

  return (
    <StoreLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {store.name} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Controla tu negocio desde aquí</p>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border-2 transition-all ${store.is_open_now ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${store.is_open_now ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <Power className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{store.is_open_now ? 'Recibiendo Pedidos' : 'Negocio Cerrado'}</h2>
                <p className={`text-sm font-medium ${store.is_open_now ? 'text-green-700' : 'text-red-700'}`}>
                  {store.is_open_now ? 'Tu catálogo está visible' : 'Tu tienda está oculta'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleStoreStatus}
              disabled={updatingStatus}
              className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white shadow-md transform transition-transform active:scale-95 disabled:opacity-70 ${store.is_open_now ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {updatingStatus ? 'Actualizando...' : store.is_open_now ? 'CERRAR NEGOCIO' : 'ABRIR NEGOCIO'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-purple-500" />
              <h2 className="text-lg font-bold text-gray-900">Ofertas Flash (24h)</h2>
            </div>
            <button onClick={() => setShowOfferModal(true)} className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-4 py-2 rounded-xl font-bold hover:bg-purple-200 transition-colors">
              <Plus className="w-4 h-4" /> Crear Oferta
            </button>
          </div>
          
          {activeOffers.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">No tienes ofertas activas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeOffers.map(offer => (
                <div key={offer.id} className="flex items-center gap-4 p-4 rounded-xl border border-purple-100 bg-purple-50/50 relative">
                  <div className="w-16 h-16 bg-white rounded-lg border border-purple-200 flex items-center justify-center shrink-0"><span className="text-2xl">🔥</span></div>
                  <div>
                    <h3 className="font-bold text-gray-900 pr-4">{offer.title}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-extrabold text-purple-600">${offer.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex justify-between p-4 border-b"><h3 className="font-bold">Nueva Oferta Flash</h3><button onClick={() => setShowOfferModal(false)}><X/></button></div>
            <form onSubmit={handleCreateOffer} className="p-5 space-y-4">
              <input type="text" required placeholder="Ej: Promo Almuerzo" className="w-full px-4 py-3 rounded-xl border" value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} />
              <input type="number" required placeholder="Precio Oferta ($)" className="w-full px-4 py-3 rounded-xl border border-purple-300 bg-purple-50 font-bold" value={offerForm.price} onChange={e => setOfferForm({...offerForm, price: e.target.value})} />
              <button type="submit" disabled={updatingStatus} className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl">Publicar</button>
            </form>
          </div>
        </div>
      )}
    </StoreLayout>
  );
};

export default StoreDashboard;