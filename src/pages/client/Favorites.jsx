import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../components/layouts/ClientLayout';
import { useFavorites } from '../../hooks/useFavorites';
import { useCartContext } from '../../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import { Heart, ArrowLeft, Trash2, Plus, Store, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites, toggleFavorite, loadingFavs } = useFavorites();
  const { addToCart } = useCartContext();
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loadingFavs) {
      if (favorites.size === 0) {
        setFavoriteProducts([]);
        setLoading(false);
        return;
      }
      fetchFavoriteProducts();
    }
  }, [favorites, loadingFavs]);

  const fetchFavoriteProducts = async () => {
    try {
      setLoading(true);
      // Convertimos el Set (lista) de IDs de favoritos a un array para buscar en Supabase
      const favIds = Array.from(favorites);
      
      const { data, error } = await supabase
        .from('products')
        .select('*, stores(name)')
        .in('id', favIds)
        .eq('is_active', true);

      if (error) throw error;
      setFavoriteProducts(data || []);
    } catch (error) {
      console.error("Error cargando productos favoritos:", error);
      toast.error('Error al cargar tus guardados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="pb-24 max-w-screen-xl mx-auto mt-2 px-4 sm:px-0">
        
        <div className="flex items-center gap-3 mb-6 mt-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all">
            <ArrowLeft className="w-6 h-6 text-gray-700"/>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Mis Guardados <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Tus productos favoritos en un solo lugar</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div></div>
        ) : favoriteProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white rounded-[2rem] border border-dashed border-gray-300">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-12 h-12 text-red-300" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Aún no tienes favoritos</h2>
            <p className="text-gray-500 mb-6 max-w-sm">Explora las tiendas y toca el corazón en los productos que más te gusten para guardarlos aquí.</p>
            <button onClick={() => navigate('/')} className="bg-gray-900 text-white font-bold py-3.5 px-8 rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-transform">
              <ShoppingBag className="w-5 h-5"/> Explorar tiendas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                
                <div onClick={() => navigate(`/stores/${product.store_id}`)} className="w-28 h-28 rounded-xl bg-gray-100 overflow-hidden shrink-0 cursor-pointer">
                  {product.image_url ? (
                    <img src={product.image_url} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform" />
                  ) : (
                    <Store className="w-8 h-8 m-auto text-gray-300 mt-10"/>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate mb-0.5 block">
                      {product.stores?.name}
                    </span>
                    <h3 onClick={() => navigate(`/stores/${product.store_id}`)} className="font-bold text-gray-900 leading-tight truncate cursor-pointer hover:text-orange-500 transition-colors">
                      {product.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-end justify-between mt-2">
                    <span className="font-black text-lg text-gray-900">${product.price.toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      {/* Botón Quitar Favorito */}
                      <button 
                        onClick={(e) => toggleFavorite(product.id, e)} 
                        className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors shadow-sm"
                      >
                        <Trash2 className="w-4 h-4"/>
                      </button>
                      {/* Botón Agregar al Carrito */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(product); toast.success('Agregado', {position: 'bottom-center'}); }} 
                        className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-orange-500 transition-colors shadow-md"
                      >
                        <Plus className="w-5 h-5"/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
};

export default Favorites;