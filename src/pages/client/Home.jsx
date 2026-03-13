import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../components/layouts/ClientLayout';
import { Card, Button, LoadingSpinner } from '../../components/common';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const Home = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stores, setStores] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

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
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch featured stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'active')
        .limit(6)
        .order('created_at', { ascending: false });

      if (storesError) throw storesError;
      setStores(storesData || []);

      // Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('store_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (catError) throw catError;
      setDbCategories(catData || []);

      // Check if it's the first order for the shipping banner
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count, error: orderError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', user.id);

        if (!orderError) {
          setIsFirstOrder(count === 0);
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (slug) => {
    navigate(`/stores?category=${slug}`);
  };

  const handleStoreClick = (storeId) => {
    navigate(`/stores/${storeId}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/stores?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleActivateLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }

    setIsLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocationLoading(false);
        toast.success('Ubicación activada correctamente');
        console.log('Location:', position.coords);
        // Here you could save the coords to context or state
      },
      (error) => {
        setIsLocationLoading(false);
        let message = 'Error al obtener ubicación';
        if (error.code === 1) message = 'Permiso de ubicación denegado';
        toast.error(message);
      }
    );
  };

  return (
    <ClientLayout>
      <div className="space-y-12">
        {/* Welcome Banner & Search */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-8 md:p-16 text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight">
              ¡Hola, {profile?.full_name?.split(' ')[0] || 'bienvenido'}!
            </h1>
            <p className="text-white/90 text-lg md:text-2xl mb-10 font-medium">
              Todo lo que necesitas, entregado en minutos. ⚡
            </p>

            {/* Search Bar - Premium Style */}
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <span className="text-2xl group-focus-within:scale-110 transition-transform">🔍</span>
              </div>
              <input
                type="text"
                placeholder="¿Qué se te antoja hoy? (pizzas, hamburguesas...)"
                className="w-full bg-white text-gray-900 pl-16 pr-32 py-5 rounded-2xl text-lg font-medium shadow-lg focus:ring-4 focus:ring-white/20 focus:outline-none transition-all placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-3 inset-y-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 rounded-xl font-bold hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-wider"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* Decorative Floaties */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-10 right-20 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
        </div>

        {/* Categories Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Categorías</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-6">
            {dbCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.slug)}
                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-transparent hover:scale-105"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`w-16 h-16 rounded-2xl ${categoryStyles[category.slug]?.color || 'bg-gray-100 text-gray-600'} flex items-center justify-center text-3xl transition-transform group-hover:scale-110`}>
                    {category.icon_name || '📦'}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{category.name}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Promotional Banners */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Promociones especiales</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 md:gap-10">
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer">
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
                  <span className="text-2xl">🚚</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  {isFirstOrder ? '¡Tu primer Envío es Gratis!' : '¡Nuevas ofertas cada día!'}
                </h3>
                <p className="text-purple-100 mb-6 text-lg">
                  {isFirstOrder
                    ? 'En compras mayores a $5.000, nosotros invitamos el envío'
                    : 'Encuentra los mejores precios en tus tiendas favoritas'}
                </p>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/stores')}
                  className="bg-white text-purple-600 hover:bg-purple-50"
                >
                  Continuar
                </Button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer">
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
                  <span className="text-2xl">🎉</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Descuento 20%</h3>
                <p className="text-orange-100 mb-6 text-lg">En restaurantes seleccionados</p>
                <button
                  onClick={() => navigate('/stores?category=food')}
                  className="bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-all shadow-lg group-hover:scale-105"
                >
                  Ver restaurantes
                </button>
              </div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
            </div>
          </div>
        </section>

        {/* Featured Stores */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Tiendas destacadas</h2>
            <button
              onClick={() => navigate('/stores')}
              className="text-orange-600 hover:text-orange-700 font-semibold text-sm flex items-center space-x-1 group"
            >
              <span>Ver todas</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => handleStoreClick(store.id)}
                  className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent hover:scale-105 text-left"
                >
                  {/* Store Image */}
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                    {store.logo_url ? (
                      <img
                        src={store.logo_url}
                        alt={store.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-6xl">🏪</span>
                    )}
                  </div>

                  {/* Store Info */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-orange-600 transition-colors">{store.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-1">
                      {store.description || 'Descripción no disponible'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-semibold text-gray-900">
                          {store.rating ? store.rating.toFixed(1) : '4.5'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-600">
                        <span className="flex items-center">⏱️ {store.delivery_time || '30-40'} min</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && stores.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🏪</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No hay tiendas disponibles
                </h3>
                <p className="text-gray-600">
                  Vuelve más tarde para ver tiendas en tu área
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Near You Section */}
        <section className="pb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Cerca de ti</h2>
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-12 text-center border border-blue-100">
            <div className="relative z-10 max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">📍</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Activa tu ubicación
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                Para ver tiendas y restaurantes cerca de ti
              </p>
              <button
                onClick={handleActivateLocation}
                disabled={isLocationLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-70"
              >
                {isLocationLoading ? 'Activando...' : 'Activar ubicación'}
              </button>
            </div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200/30 rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-200/30 rounded-full -ml-16 -mb-16" />
          </div>
        </section>
      </div>
    </ClientLayout>
  );
};

export default Home;
