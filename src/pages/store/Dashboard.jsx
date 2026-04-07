import React, { useState, useEffect, useRef } from 'react';
import StoreLayout from '../../components/layouts/StoreLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Zap, Plus, Power, X, Upload, Eye, Users, Image as ImageIcon, Trash2, MessageCircle, TrendingUp, BarChart3, Activity } from 'lucide-react';

const StoreDashboard = () => {
  const { profile } = useAuth();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [previewOffer, setPreviewOffer] = useState(null); 
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [activeOffers, setActiveOffers] = useState([]);
  
  const [offerForm, setOfferForm] = useState({
    title: '', price: '', duration_hours: '24', image_url: ''
  });

  useEffect(() => {
    let timer;
    if (previewOffer) timer = setTimeout(() => setPreviewOffer(null), 5000);
    return () => clearTimeout(timer);
  }, [previewOffer]);

  useEffect(() => {
    if (profile?.id) fetchStoreData();
  }, [profile]);

  const fetchStoreData = async () => {
    try {
      const { data, error } = await supabase.from('stores').select('*').eq('owner_id', profile.id).single();
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
      const { data, error } = await supabase.from('flash_offers').select('*').eq('store_id', storeId).eq('is_active', true).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false });
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
      const { error } = await supabase.from('stores').update({ is_open_now: newStatus }).eq('id', store.id);
      if (error) throw error;
      setStore({ ...store, is_open_now: newStatus });
      toast.success(newStatus ? '¡Tu tienda está ABIERTA al público!' : 'Has cerrado tu tienda temporalmente.');
    } catch (error) {
      toast.error('Hubo un error al cambiar el estado.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !store) return;
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `offer_${store.id}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `store_images/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
      setOfferForm({ ...offerForm, image_url: publicUrl });
      toast.success('¡Foto cargada, lista para publicar!');
    } catch (error) {
      toast.error('Error al subir la foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!store) return;
    if (!offerForm.image_url) return toast.error('Añade una foto para hacer tu oferta más atractiva');
    
    try {
      setUpdatingStatus(true);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(offerForm.duration_hours));

      const { data, error } = await supabase.from('flash_offers').insert([{
        store_id: store.id, title: offerForm.title, price: parseFloat(offerForm.price),
        image_url: offerForm.image_url, expires_at: expiresAt.toISOString(), is_active: true, views_count: 0
      }]).select().single();

      if (error) throw error;
      toast.success('¡Estado publicado con éxito!');
      setShowOfferModal(false);
      setOfferForm({ title: '', price: '', duration_hours: '24', image_url: '' });
      setActiveOffers([data, ...activeOffers]);
    } catch (error) {
      toast.error('No se pudo publicar la oferta.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este estado?')) return;
    try {
      await supabase.from('flash_offers').delete().eq('id', offerId);
      setActiveOffers(activeOffers.filter(o => o.id !== offerId));
      setPreviewOffer(null);
      toast.success('Estado eliminado');
    } catch (error) {
      toast.error('No se pudo eliminar el estado');
    }
  };

  // Calcular impacto de estados
  const totalStoryViews = activeOffers.reduce((sum, offer) => sum + (offer.views_count || 0), 0);

  if (loading) return <StoreLayout><div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div></div></StoreLayout>;

  return (
    <StoreLayout>
      <div className="space-y-8">
        
        {/* HEADER: ESTADO DEL NEGOCIO */}
        <div className={`p-8 rounded-[2rem] shadow-lg border-2 transition-all relative overflow-hidden ${store?.is_open_now ? 'bg-gradient-to-br from-green-500 to-emerald-700 border-green-400' : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700'}`}>
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10">
            {store?.is_open_now ? <TrendingUp className="w-64 h-64 text-white" /> : <Power className="w-64 h-64 text-white" />}
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white text-center md:text-left">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3 ${store?.is_open_now ? 'bg-green-400/30 text-green-50' : 'bg-red-500/30 text-red-100'}`}>
                {store?.is_open_now ? <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span> : <span className="w-2 h-2 rounded-full bg-red-400"></span>}
                {store?.is_open_now ? 'En Línea y Visible' : 'Fuera de Servicio'}
              </span>
              <h1 className="text-4xl font-black mb-2">{store?.is_open_now ? '¡Tu tienda está Abierta!' : 'Negocio Cerrado'}</h1>
              <p className="text-white/80 font-medium text-lg">
                {store?.is_open_now ? 'Los clientes pueden ver tu catálogo y contactarte por WhatsApp.' : 'Tus clientes solo pueden ver tu menú, pero no hacer pedidos.'}
              </p>
            </div>
            
            <button onClick={toggleStoreStatus} disabled={updatingStatus} className={`w-full md:w-auto px-10 py-5 rounded-2xl font-black text-lg shadow-xl transform transition-all active:scale-95 flex items-center justify-center gap-3 ${store?.is_open_now ? 'bg-white text-green-700 hover:bg-green-50' : 'bg-green-500 text-white hover:bg-green-400'}`}>
              <Power className="w-6 h-6" /> {updatingStatus ? 'Actualizando...' : store?.is_open_now ? 'CERRAR TIENDA' : 'ABRIR TIENDA AHORA'}
            </button>
          </div>
        </div>

        {/* MÉTRICAS (EL EMBUDO DE CONVERSIÓN) */}
        <div>
          <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-purple-600"/> Rendimiento de Hoy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Métrica 1: Visitas al Perfil */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><Users className="w-6 h-6"/></div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Visitas a la Tienda</p>
                <div className="flex items-end gap-2 mt-1">
                  <p className="text-4xl font-black text-gray-900">{store?.daily_views || 0}</p>
                  <span className="text-blue-500 text-sm font-bold mb-1 border border-blue-200 bg-blue-50 px-2 rounded-md">Personas</span>
                </div>
              </div>
            </div>

            {/* Métrica 2: Vistas de Estados */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4"><Eye className="w-6 h-6"/></div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Impacto de Estados</p>
                <div className="flex items-end gap-2 mt-1">
                  <p className="text-4xl font-black text-gray-900">{totalStoryViews}</p>
                  <span className="text-purple-500 text-sm font-bold mb-1 border border-purple-200 bg-purple-50 px-2 rounded-md">Visualizaciones</span>
                </div>
              </div>
            </div>

            {/* Métrica 3: Clics a WhatsApp */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4"><MessageCircle className="w-6 h-6"/></div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Clics a WhatsApp</p>
                <div className="flex items-end gap-2 mt-1">
                  <p className="text-4xl font-black text-gray-900">{store?.whatsapp_clicks || 0}</p>
                  <span className="text-green-500 text-sm font-bold mb-1 border border-green-200 bg-green-50 px-2 rounded-md">Leads Reales</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* OFERTAS FLASH (ESTADOS) */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Zap className="w-8 h-8 text-yellow-500" fill="currentColor"/> Mis Estados (Ofertas Flash)</h2>
              <p className="text-gray-500 text-sm mt-1">Sube fotos atractivas para que más personas vayan a tu WhatsApp.</p>
            </div>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-4 pt-2 snap-x hide-scrollbar">
            {/* BOTÓN NUEVO ESTADO */}
            <div className="flex flex-col items-center gap-3 shrink-0 snap-start">
              <button onClick={() => setShowOfferModal(true)} className="w-24 h-24 rounded-full border-2 border-dashed border-purple-400 flex items-center justify-center bg-purple-50 text-purple-600 hover:bg-purple-100 hover:scale-110 transition-all shadow-sm">
                <Plus className="w-10 h-10" />
              </button>
              <span className="text-sm font-black text-gray-700">Añadir Estado</span>
            </div>

            {/* LISTA DE ESTADOS */}
            {activeOffers.map(offer => (
              <div key={offer.id} onClick={() => setPreviewOffer(offer)} className="flex flex-col items-center gap-3 shrink-0 snap-start cursor-pointer group">
                <div className="w-24 h-24 rounded-full p-[4px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 shadow-md group-hover:scale-105 transition-transform relative">
                  <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-white">
                    {offer.image_url ? <img src={offer.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl">🔥</div>}
                  </div>
                  {/* BADGE DE VISTAS EN LA FOTO */}
                  <div className="absolute -bottom-2 right-0 bg-gray-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg border-2 border-white">
                    <Eye className="w-3 h-3"/> {offer.views_count || 0}
                  </div>
                </div>
                <div className="text-center w-28">
                  <span className="text-sm font-bold text-gray-900 truncate block">{offer.title}</span>
                  <span className="text-xs font-black text-purple-600">${offer.price.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* VISOR DE ESTADOS INMERSIVO */}
      {previewOffer && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
          <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
            <div className="h-1 bg-white/30 rounded-full overflow-hidden flex-1"><div className="h-full bg-white rounded-full" style={{ width: '100%', transition: 'width 5s linear', transformOrigin: 'left', animation: 'shrinkWidth 5s linear forwards' }} /></div>
          </div>

          <div className="p-4 pt-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-full border border-gray-500 overflow-hidden">{store?.logo_url && <img src={store.logo_url} className="w-full h-full object-cover" />}</div>
              <div><p className="font-bold text-sm shadow-sm">Mi Estado</p><p className="text-xs text-green-400 font-bold flex items-center gap-1"><Eye className="w-3 h-3"/> {previewOffer.views_count} personas lo vieron</p></div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => handleDeleteOffer(previewOffer.id)} className="text-white hover:text-red-400 p-2"><Trash2 className="w-6 h-6"/></button>
              <button onClick={() => setPreviewOffer(null)} className="text-white p-2"><X className="w-6 h-6"/></button>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative pt-20 pb-24 px-4" onClick={() => setPreviewOffer(null)}>
             {previewOffer.image_url && <img src={previewOffer.image_url} className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" />}
          </div>
          
          <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent absolute bottom-0 w-full text-center text-white pb-10">
            <h2 className="text-2xl font-black drop-shadow-md">{previewOffer.title}</h2>
            <p className="text-3xl font-black text-purple-400 drop-shadow-md mt-1">${previewOffer.price.toLocaleString()}</p>
          </div>
          <style>{`@keyframes shrinkWidth { from { width: 0%; } to { width: 100%; } }`}</style>
        </div>
      )}

      {/* MODAL CREAR ESTADO */}
      {showOfferModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between p-5 border-b border-gray-100"><h3 className="font-black text-lg">Nuevo Estado</h3><button onClick={() => setShowOfferModal(false)} className="bg-gray-100 p-1.5 rounded-full"><X className="w-5 h-5"/></button></div>
            <form onSubmit={handleCreateOffer} className="p-6 space-y-5">
              <div className="space-y-2">
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden bg-gray-50 hover:bg-purple-50 group">
                  {isUploading ? <Upload className="animate-bounce text-purple-600" /> : offerForm.image_url ? <img src={offerForm.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="text-center text-gray-400 font-medium text-sm flex flex-col items-center"><ImageIcon className="w-8 h-8 mb-2 opacity-50"/>Toca para subir foto</div>}
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
              </div>
              <input type="text" required placeholder="¿Qué vas a promocionar?" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none" value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" required placeholder="Precio ($)" className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 font-black outline-none" value={offerForm.price} onChange={e => setOfferForm({...offerForm, price: e.target.value})} />
                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm font-medium" value={offerForm.duration_hours} onChange={e => setOfferForm({...offerForm, duration_hours: e.target.value})}>
                  <option value="24">Dura 24 horas</option>
                  <option value="12">Dura 12 horas</option>
                  <option value="6">Dura 6 horas</option>
                </select>
              </div>
              <button type="submit" disabled={updatingStatus || isUploading} className="w-full bg-gray-900 text-white font-black py-4 rounded-xl active:scale-95 transition-transform">Publicar Estado</button>
            </form>
          </div>
        </div>
      )}
    </StoreLayout>
  );
};

export default StoreDashboard;