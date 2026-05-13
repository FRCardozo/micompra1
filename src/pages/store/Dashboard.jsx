import React, { useState, useEffect, useRef } from 'react';
import StoreLayout from '../../components/layouts/StoreLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Zap, Plus, Power, X, Upload, Eye, Users, Image as ImageIcon, Trash2, MessageCircle, TrendingUp, BarChart3, Flame, Tag, Heart, Store, Clock, AlertTriangle, Send, MapPin } from 'lucide-react';

// --- IMPORTACIONES DE LEAFLET PARA EL MAPA ---
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Arreglo para el ícono del mapa
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para el pin arrastrable
function DraggableMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return (
    <Marker
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition({ lat: pos.lat, lng: pos.lng });
        },
      }}
      position={[position.lat, position.lng]}
    />
  );
}

// Componente para volar automáticamente al municipio elegido
function MapUpdater({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 15);
    }
  }, [lat, lng, map]);
  return null;
}

const StoreDashboard = () => {
  const { profile } = useAuth();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [activeOffers, setActiveOffers] = useState([]);
  
  const [activeStoryIndex, setActiveStoryIndex] = useState(null); 
  const [isPaused, setIsPaused] = useState(false);
  
  const [todayStats, setTodayStats] = useState({
    views: 0, story_views: 0, whatsapp_clicks: 0
  });

  const [offerForm, setOfferForm] = useState({
    title: '', price: '', duration_hours: '24', image_url: '', stock: ''
  });

  // --- ESTADOS PARA EL REGISTRO DE LA TIENDA ---
  const [zones, setZones] = useState([]);
  const [formData, setFormData] = useState({
    name: '', 
    address: '', 
    phone: '',
    lat: 8.9167, // Default inicial
    lng: -75.1833
  });
  const [submitting, setSubmitting] = useState(false);

  const getTimeRemaining = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return 'Expirando...';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  useEffect(() => {
    if (profile?.id) {
      fetchStoreData();

      const channel = supabase
        .channel('dashboard_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_stats' }, (payload) => {
            const today = new Date().toISOString().split('T')[0];
            if (payload.new && payload.new.store_id === store?.id && payload.new.date === today) {
              setTodayStats({
                views: payload.new.views || 0,
                story_views: payload.new.story_views || 0,
                whatsapp_clicks: payload.new.whatsapp_clicks || 0
              });
            }
          })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stores', filter: `owner_id=eq.${profile.id}` }, (payload) => {
            setStore(prev => ({ ...prev, ...payload.new }));
          })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_offers' }, () => {
            if (store?.id) fetchActiveOffers(store.id);
          })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [profile, store?.id]);

  // Carga paralela de Zonas si la tienda no existe
  const fetchZones = async () => {
    try {
      const { data } = await supabase.from('coverage_zones').select('*').eq('is_active', true);
      if (data && data.length > 0) {
        setZones(data);
      }
    } catch (error) {
      console.error('Error fetching zones', error);
    }
  };

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const { data: storeData, error: storeError } = await supabase.from('stores').select('*').eq('owner_id', profile.id).maybeSingle();
      if (storeError) throw storeError;
      setStore(storeData);
      
      if (!storeData) {
        fetchZones(); // Si es nuevo, cargamos las zonas para el formulario
      } else if (storeData.status === 'active') { 
        fetchActiveOffers(storeData.id);
        const today = new Date().toISOString().split('T')[0];
        const { data: stats } = await supabase.from('daily_stats').select('*').eq('store_id', storeData.id).eq('date', today).maybeSingle();
        if (stats) setTodayStats({ views: stats.views || 0, story_views: stats.story_views || 0, whatsapp_clicks: stats.whatsapp_clicks || 0 });
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('stores')
        .insert([{
          owner_id: profile.id,
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          lat: formData.lat, 
          lng: formData.lng, 
          status: 'pending_approval' // ¡ENUM CORREGIDO!
        }]);

      if (error) throw error;
      toast.success('¡Solicitud enviada con éxito!');
      fetchStoreData();
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      toast.error('Hubo un error al enviar tu solicitud');
    } finally {
      setSubmitting(false);
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
      toast.success(newStatus ? '¡Tienda ABIERTA!' : 'Tienda CERRADA');
    } catch (error) {
      toast.error('Error al cambiar estado');
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
      toast.success('Foto cargada');
    } catch (error) {
      toast.error('Error al subir foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.image_url || !offerForm.title || !offerForm.price) return toast.error('Completa los campos obligatorios');
    try {
      setUpdatingStatus(true);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(offerForm.duration_hours));
      const { data, error } = await supabase.from('flash_offers').insert([{
        store_id: store.id, title: offerForm.title, price: parseFloat(offerForm.price),
        stock: offerForm.stock ? parseInt(offerForm.stock) : null, image_url: offerForm.image_url, 
        expires_at: expiresAt.toISOString(), is_active: true, views_count: 0, likes_count: 0
      }]).select();
      if (error) throw error;
      if (data) setActiveOffers(prev => [data[0], ...prev]);
      toast.success('¡Estado publicado!');
      setShowOfferModal(false);
      setOfferForm({ title: '', price: '', duration_hours: '24', image_url: '', stock: '' });
    } catch (error) {
      toast.error('Error al publicar');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este estado?")) return;
    try {
      const { error } = await supabase.from('flash_offers').delete().eq('id', offerId);
      if (error) throw error;
      toast.success('Estado eliminado');
      setActiveStoryIndex(null); 
      setActiveOffers(activeOffers.filter(offer => offer.id !== offerId)); 
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const nextStory = () => {
    if (activeStoryIndex < activeOffers.length - 1) setActiveStoryIndex(activeStoryIndex + 1);
    else setActiveStoryIndex(null); 
  };
  const prevStory = () => {
    if (activeStoryIndex > 0) setActiveStoryIndex(activeStoryIndex - 1);
  };

  if (loading) return <StoreLayout><div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div></div></StoreLayout>;

  // =========================================================================
  // LAS PUERTAS LÓGICAS (EL GUARDIÁN)
  // =========================================================================

  if (!store) {
    return (
      <StoreLayout>
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mt-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <Store className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido a MiCompra!</h2>
          <p className="text-gray-500 mb-6">Para comenzar a vender, necesitamos los datos de tu negocio.</p>
          
          <form onSubmit={handleApply} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de tu Tienda *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej: Ferretería El Primo" />
                </div>
                
                {/* SELECTOR DE MUNICIPIO */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Municipio *</label>
                  <select 
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    onChange={(e) => {
                      const selectedZone = zones.find(z => z.id === e.target.value);
                      if (selectedZone) {
                        setFormData(prev => ({ 
                          ...prev, 
                          lat: selectedZone.center_lat, 
                          lng: selectedZone.center_lng 
                        }));
                      }
                    }}
                  >
                    <option value="">Selecciona donde estás ubicado...</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección Escrita *</label>
                  <input type="text" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej: Calle 4 #12-34" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono (WhatsApp) *</label>
                  <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej: 3001234567" />
                </div>
              </div>

              {/* MAPA INTERACTIVO */}
              <div className="flex flex-col">
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500"/> Ubicación en el Mapa (Opcional)
                </label>
                <p className="text-xs text-gray-500 mb-2">Selecciona un municipio a la izquierda y arrastra el pin a tu local.</p>
                <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden min-h-[250px] border border-gray-300 relative z-0">
                  <MapContainer center={[formData.lat, formData.lng]} zoom={15} className="w-full h-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapUpdater lat={formData.lat} lng={formData.lng} />
                    <DraggableMarker 
                      position={{ lat: formData.lat, lng: formData.lng }} 
                      setPosition={(pos) => setFormData(prev => ({ ...prev, lat: pos.lat, lng: pos.lng }))} 
                    />
                  </MapContainer>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button type="submit" disabled={submitting} className="w-full md:w-auto md:px-12 flex justify-center items-center gap-2 bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
                <Send className="w-5 h-5" /> {submitting ? 'Enviando Solicitud...' : 'Enviar Solicitud de Tienda'}
              </button>
            </div>
          </form>
        </div>
      </StoreLayout>
    );
  }

  // --- RESTRICCIÓN DE ESTADOS SEGÚN ENUM ---
  if (store.status === 'pending_approval') {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto bg-orange-50 border-2 border-orange-200 p-10 rounded-3xl text-center mt-10">
          <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-black text-orange-800 mb-2">Tu tienda está en revisión</h2>
          <p className="text-orange-700">Hemos recibido los datos de <strong>{store.name}</strong>. Nuestro equipo verificará tu solicitud.</p>
        </div>
      </StoreLayout>
    );
  }

  if (store.status === 'rejected' || store.status === 'suspended') {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto bg-red-50 border-2 border-red-200 p-10 rounded-3xl text-center mt-10">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-red-800 mb-2">Tienda Suspendida / Rechazada</h2>
          <p className="text-red-700 mb-6">No pudimos aprobar o mantener activa la tienda <strong>{store.name}</strong>. Comunícate con soporte.</p>
        </div>
      </StoreLayout>
    );
  }

  // =========================================================================
  // TU DASHBOARD ORIGINAL (Solo se muestra si la tienda está 'active' o 'inactive')
  // =========================================================================

  return (
    <StoreLayout>
      <div className="space-y-6">
        <div className={`p-8 rounded-[2rem] shadow-lg border-2 transition-all relative overflow-hidden ${store?.is_open_now ? 'bg-gradient-to-br from-green-500 to-emerald-700 border-green-400' : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700'}`}>
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10">
            {store?.is_open_now ? <TrendingUp className="w-64 h-64 text-white" /> : <Power className="w-64 h-64 text-white" />}
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white text-center md:text-left">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3 ${store?.is_open_now ? 'bg-green-400/30 text-green-50' : 'bg-red-500/30 text-red-100'}`}>
                {store?.is_open_now ? <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span> : <span className="w-2 h-2 rounded-full bg-red-400"></span>}
                {store?.is_open_now ? 'En Línea' : 'Cerrado'}
              </span>
              <h1 className="text-4xl font-black mb-2">{store?.is_open_now ? '¡Tienda Abierta!' : 'Negocio Cerrado'}</h1>
              <p className="text-white/80 font-medium text-lg">Controla la visibilidad de tu negocio en tiempo real.</p>
            </div>
            <button onClick={toggleStoreStatus} disabled={updatingStatus} className={`w-full md:w-auto px-10 py-5 rounded-2xl font-black text-lg shadow-xl transform transition-all active:scale-95 flex items-center justify-center gap-3 ${store?.is_open_now ? 'bg-white text-green-700 hover:bg-green-50' : 'bg-green-500 text-white hover:bg-green-400'}`}>
              <Power className="w-6 h-6" /> {updatingStatus ? '...' : store?.is_open_now ? 'CERRAR TIENDA' : 'ABRIR TIENDA'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-6"><Zap className="w-7 h-7 text-yellow-500" fill="currentColor"/> Mis Estados</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x hide-scrollbar">
            <div className="flex flex-col items-center gap-2 shrink-0 snap-start">
              <button onClick={() => setShowOfferModal(true)} className="w-20 h-20 rounded-full border-2 border-dashed border-purple-400 flex items-center justify-center bg-purple-50 text-purple-600 hover:bg-purple-100 shadow-sm"><Plus className="w-8 h-8" /></button>
              <span className="text-xs font-black text-gray-700">Añadir</span>
            </div>
            {activeOffers.map((offer, index) => (
              <div key={offer.id} onClick={() => { setActiveStoryIndex(index); setIsPaused(false); }} className="flex flex-col items-center gap-2 shrink-0 snap-start cursor-pointer group">
                <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 shadow-md group-hover:scale-105 transition-transform relative">
                  <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                    {offer.image_url ? <img src={offer.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl">🔥</div>}
                  </div>
                  <div className="absolute -bottom-2 right-0 bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-md border border-white">
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3"/> {offer.views_count || 0}</span>
                    <span className="flex items-center gap-0.5 text-red-400"><Heart className="w-3 h-3 fill-current"/> {offer.likes_count || 0}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-900 truncate w-24 block text-center">{offer.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-purple-600"/> Rendimiento de Hoy</h2>
          <div className="grid grid-cols-3 gap-4 divide-x divide-gray-100">
            <div className="text-center px-2">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center justify-center gap-1">
                <Users className="w-3 h-3" /> VISITAS
              </p>
              <p className="text-2xl font-black text-blue-600">{todayStats.views}</p>
            </div>
            <div className="text-center px-2">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center justify-center gap-1">
                <Eye className="w-3 h-3" /> ESTADOS
              </p>
              <p className="text-2xl font-black text-purple-600">{todayStats.story_views}</p>
            </div>
            <div className="text-center px-2">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center justify-center gap-1">
                <MessageCircle className="w-3 h-3" /> WHATSAPP
              </p>
              <p className="text-2xl font-black text-green-600">{todayStats.whatsapp_clicks}</p>
            </div>
          </div>
          <div className="mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
            <p className="text-[10px] text-gray-500 leading-relaxed">
              💡 <strong>Visitas:</strong> Perfil abierto. <strong>Estados:</strong> Vistas en ofertas. <strong>WhatsApp:</strong> Pedidos iniciados.
            </p>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Las métricas se reinician diariamente.
            </p>
          </div>
        </div>
      </div>

      {showOfferModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="flex justify-between p-5 border-b border-gray-100"><h3 className="font-black text-lg">Nuevo Estado</h3><button onClick={() => setShowOfferModal(false)} className="bg-gray-100 p-1.5 rounded-full"><X className="w-5 h-5"/></button></div>
            <form onSubmit={handleCreateOffer} className="p-6 space-y-4">
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-2xl h-40 flex flex-col items-center justify-center cursor-pointer bg-gray-50 overflow-hidden">
                {isUploading ? <Upload className="animate-bounce" /> : offerForm.image_url ? <img src={offerForm.image_url} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300 w-8 h-8"/>}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </div>
              <input type="text" required placeholder="Título (Ej. Hamburguesa Promo)" className="w-full px-4 py-3 rounded-xl border bg-gray-50 outline-none font-bold" value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" required placeholder="Precio" className="w-full px-4 py-3 rounded-xl border bg-orange-50 text-orange-900 font-black" value={offerForm.price} onChange={e => setOfferForm({...offerForm, price: e.target.value})} />
                
                <input type="number" placeholder="Stock (Opcional)" className="w-full px-4 py-3 rounded-xl border bg-red-50 text-red-900 font-black placeholder:text-red-300/70" value={offerForm.stock} onChange={e => setOfferForm({...offerForm, stock: e.target.value})} />
              </div>
              <span className="text-[9px] text-gray-500 mt-1.5 px-1 leading-tight">
                  💡 Si pones 10 o menos stock, el cliente verá una alerta de escasez.
              </span>
              <button type="submit" disabled={updatingStatus || isUploading} className="w-full bg-gray-900 text-white font-black py-4 rounded-xl">Publicar</button>
            </form>
          </div>
        </div>
      )}

      {/* --- VISOR DE HISTORIAS --- */}
      {activeStoryIndex !== null && activeOffers[activeStoryIndex] && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in select-none">
          
          <div className="absolute top-2 left-2 right-2 flex gap-1 z-30">
            {activeOffers.map((_, idx) => (
              <div key={idx} className="h-1 bg-white/30 rounded-full overflow-hidden flex-1">
                <div 
                  className="h-full bg-white rounded-full" 
                  onAnimationEnd={() => { if (idx === activeStoryIndex) nextStory(); }}
                  style={{ 
                    width: idx < activeStoryIndex ? '100%' : idx === activeStoryIndex ? '100%' : '0%', 
                    transition: idx < activeStoryIndex ? 'none' : 'width 5s linear', 
                    transformOrigin: 'left', 
                    animationName: idx === activeStoryIndex ? 'shrinkWidth' : 'none',
                    animationDuration: '5s',
                    animationTimingFunction: 'linear',
                    animationFillMode: 'forwards',
                    animationPlayState: isPaused ? 'paused' : 'running' 
                  }} 
                />
              </div>
            ))}
          </div>

          <div className="absolute top-0 w-full pt-6 pb-4 px-4 flex justify-between items-start z-30 text-white bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="w-10 h-10 rounded-full border border-orange-500 overflow-hidden bg-white shrink-0">
                {store?.logo_url && <img src={store.logo_url} className="w-full h-full object-cover" />}
              </div>
              <div>
                <p className="font-bold text-sm shadow-sm leading-tight">{store?.name}</p>
                <div className="flex items-center gap-2 mt-1">
                   <span className="flex items-center gap-1 text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm"><Eye className="w-3 h-3"/> {activeOffers[activeStoryIndex].views_count || 0}</span>
                   <span className="flex items-center gap-1 text-[10px] font-bold bg-red-500/20 text-red-100 px-2 py-0.5 rounded-full backdrop-blur-sm"><Heart className="w-3 h-3 fill-red-500 text-red-500"/> {activeOffers[activeStoryIndex].likes_count || 0}</span>
                   <span className="flex items-center gap-1 text-[10px] font-bold bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">⏱️ {getTimeRemaining(activeOffers[activeStoryIndex].expires_at)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pointer-events-auto">
              <button onClick={() => handleDeleteOffer(activeOffers[activeStoryIndex].id)} className="p-2 bg-red-500/80 rounded-full hover:bg-red-600 transition-colors shadow-lg">
                <Trash2 className="w-5 h-5"/>
              </button>
              <button onClick={() => setActiveStoryIndex(null)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors shadow-lg">
                <X className="w-5 h-5"/>
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative pt-20 pb-32 px-4 w-full h-full cursor-pointer" onPointerDown={() => setIsPaused(true)} onPointerUp={() => setIsPaused(false)} onPointerLeave={() => setIsPaused(false)}>
             <div className="absolute left-0 top-0 bottom-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); prevStory(); }} />
             <div className="absolute right-0 top-0 bottom-0 w-2/3 z-10" onClick={(e) => { e.stopPropagation(); nextStory(); }} />
             <div className="relative z-0 pointer-events-none">
                <img 
                  src={activeOffers[activeStoryIndex].image_url} 
                  className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] pointer-events-auto border border-white/10" 
                />
             </div>
          </div>

          <div className="p-8 bg-gradient-to-t from-black via-black/60 to-transparent absolute bottom-0 w-full flex flex-col items-center pointer-events-none z-20">
              {(activeOffers[activeStoryIndex].stock > 0 && activeOffers[activeStoryIndex].stock <= 10) && (
                <div className="mb-3 px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded-full animate-bounce shadow-lg flex items-center gap-1.5 pointer-events-auto">
                  <Flame className="w-3 h-3 fill-white" /> ¡SOLO QUEDAN {activeOffers[activeStoryIndex].stock}!
                </div>
              )}

             <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3 text-white shadow-xl pointer-events-auto">
                <Tag className="w-5 h-5 text-orange-400" />
                <span className="font-bold">{activeOffers[activeStoryIndex].title}</span>
                <span className="text-white/40">|</span>
                <span className="text-orange-400 font-black">${activeOffers[activeStoryIndex].price.toLocaleString()}</span>
             </div>
          </div>
          <style>{`@keyframes shrinkWidth { from { width: 0%; } to { width: 100%; } }`}</style>
        </div>
      )}
    </StoreLayout>
  );
};

export default StoreDashboard;