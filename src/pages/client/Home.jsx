import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../components/layouts/ClientLayout';
import { Button, LoadingSpinner } from '../../components/common';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stores, setStores] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  const categoryStyles = {
    food: { color: 'bg-orange-100 text-orange-600' },
    supermarket: { color: 'bg-green-100 text-green-600' },
    pharmacy: { color: 'bg-red-100 text-red-600' },
    pet: { color: 'bg-purple-100 text-purple-600' },
    electronics: { color: 'bg-blue-100 text-blue-600' },
    fashion: { color: 'bg-pink-100 text-pink-600' },
    home: { color: 'bg-yellow-100 text-yellow-600' },
    health: { color: 'bg-rose-100 text-rose-600' },
  };

  useEffect(() => {
    fetchData();

    // REALTIME: Actualizar si una tienda abre o cierra
    const channel = supabase
      .channel('home_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stores' },
        (payload) => {
          setStores(current => 
            current.map(s => s.id === payload.new.id ? { ...s, is_open_now: payload.new.is_open_now } : s)
            .sort((a, b) => Number(b.is_open_now) - Number(a.is_open_now))
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: storesData } = await supabase.from('stores').select('*').eq('status', 'active');
      const sorted = (storesData || []).sort((a, b) => Number(b.is_open_now) - Number(a.is_open_now));
      setStores(sorted.slice(0, 6));

      const { data: catData } = await supabase.from('store_categories').select('*').eq('is_active', true).order('display_order');
      setDbCategories(catData || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('client_id', user.id);
        setIsFirstOrder(count === 0);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleCategoryClick = (slug) => navigate(`/stores?category=${slug}`);
  const handleStoreClick = (storeId) => navigate(`/stores/${storeId}`);
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) navigate(`/stores?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <ClientLayout>
      <div className="space-y-12 pb-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 md:p-16 text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4">¡Hola, {profile?.full_name?.split(' ')[0] || 'bienvenido'}!</h1>
            <p className="text-white/90 text-lg md:text-2xl mb-10 font-medium">Todo lo que necesitas, en minutos. ⚡</p>
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-2xl">🔍</div>
              <input type="text" placeholder="¿Qué se te antoja hoy?" className="w-full bg-white text-gray-900 pl-16 pr-32 py-5 rounded-2xl text-lg font-medium shadow-lg outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <button type="submit" className="absolute right-3 inset-y-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 rounded-xl font-bold uppercase tracking-wider text-sm">Buscar</button>
            </form>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Categorías</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {dbCategories.map((cat) => (
              <button key={cat.id} onClick={() => handleCategoryClick(cat.slug)} className="group bg-white rounded-2xl p-6 shadow-sm border hover:scale-105 transition-all">
                <div className="flex flex-col items-center space-y-3">
                  <div className={`w-16 h-16 rounded-2xl ${categoryStyles[cat.slug]?.color || 'bg-gray-100'} flex items-center justify-center text-3xl`}>{cat.icon_name || '📦'}</div>
                  <span className="font-semibold text-gray-900 text-sm">{cat.name}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* PROMOCIONES RECUPERADAS */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Promociones especiales</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
              <h3 className="text-2xl font-bold mb-2">{isFirstOrder ? '¡Primer Envío Gratis!' : '¡Nuevas ofertas!'}</h3>
              <p className="text-purple-100 mb-6">{isFirstOrder ? 'En compras mayores a $5.000' : 'Lo mejor de Galeras en tu casa'}</p>
              <Button variant="secondary" onClick={() => navigate('/stores')} className="bg-white text-purple-600">Continuar</Button>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-8 text-white shadow-xl group cursor-pointer" onClick={() => navigate('/stores?category=food')}>
              <h3 className="text-2xl font-bold mb-2">Descuento 20%</h3>
              <p className="text-orange-100 mb-6">En restaurantes seleccionados</p>
              <span className="bg-white text-orange-600 px-6 py-3 rounded-xl font-bold">Ver más</span>
            </div>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tiendas destacadas</h2>
            <button onClick={() => navigate('/stores')} className="text-orange-600 font-bold text-sm">Ver todas →</button>
          </div>
          {loading ? <LoadingSpinner /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stores.map((store) => (
                <button key={store.id} onClick={() => handleStoreClick(store.id)} className="group bg-white rounded-3xl overflow-hidden shadow-sm border hover:scale-105 transition-all text-left">
                  <div className="h-48 bg-gray-100 relative">
                    {store.logo_url ? <img src={store.logo_url} className={`w-full h-full object-cover ${!store.is_open_now ? 'grayscale opacity-60' : ''}`} /> : <span className="text-6xl m-auto mt-12 block text-center">🏪</span>}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 text-lg truncate flex-1">{store.name}</h3>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${store.is_open_now ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${store.is_open_now ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {store.is_open_now ? 'Abierto' : 'Cerrado'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mb-4">{store.description}</p>
                    <div className="flex justify-between text-sm font-bold text-gray-900">
                      <span>⭐ {store.rating?.toFixed(1) || '4.5'}</span>
                      <span className="text-gray-500 font-medium">⏱️ {store.delivery_time || '30'} min</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </ClientLayout>
  );
};

export default Home;