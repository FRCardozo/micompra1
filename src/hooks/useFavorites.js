import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(new Set());
  const [loadingFavs, setLoadingFavs] = useState(true);

  // Cargar los favoritos al entrar
  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      setLoadingFavs(false);
      return;
    }
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('client_favorites')
        .select('product_id')
        .eq('client_id', user.id);
      
      if (error) throw error;
      setFavorites(new Set(data.map(f => f.product_id)));
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    } finally {
      setLoadingFavs(false);
    }
  };

  // Función para dar/quitar Me Gusta
  const toggleFavorite = async (productId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      toast('¡Inicia sesión para guardar tus favoritos!', { icon: '❤️' });
      return;
    }

    const isFav = favorites.has(productId);
    const newFavorites = new Set(favorites);

    // Actualización optimista (se actualiza la pantalla antes que la DB para que se sienta instantáneo)
    if (isFav) {
      newFavorites.delete(productId);
      setFavorites(newFavorites);
      toast.success('Eliminado de favoritos', { position: 'bottom-center' });
      
      await supabase
        .from('client_favorites')
        .delete()
        .match({ client_id: user.id, product_id: productId });
    } else {
      newFavorites.add(productId);
      setFavorites(newFavorites);
      toast.success('¡Guardado en favoritos!', { icon: '❤️', position: 'bottom-center' });
      
      await supabase
        .from('client_favorites')
        .insert([{ client_id: user.id, product_id: productId }]);
    }
  };

  // Función rápida para saber si un producto ya tiene like
  const isFavorite = (productId) => favorites.has(productId);

  return { favorites, toggleFavorite, isFavorite, loadingFavs };
};