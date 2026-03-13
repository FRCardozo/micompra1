import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ClientLayout from '../../components/layouts/ClientLayout';
import { Card, Input, LoadingSpinner, EmptyState } from '../../components/common';
import { supabase } from '../../lib/supabase';

const Stores = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stores, setStores] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');

  // Sync state with URL params
  useEffect(() => {
    const category = searchParams.get('category') || 'all';
    const search = searchParams.get('search') || '';
    setSelectedCategory(category);
    setSearchTerm(search);
  }, [searchParams]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchStores();
  }, [selectedCategory, searchTerm]); // Now search is part of the fetch

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('store_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setDbCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchStores = async () => {
    try {
      setLoading(true);

      // Basic query for active stores
      let query = supabase
        .from('stores')
        .select(`
          *,
          category:store_categories(*)
        `)
        .eq('status', 'active');

      // Filter by category slug if not 'all'
      if (selectedCategory !== 'all') {
        // We use a filter on the joined table
        query = query.filter('category.slug', 'eq', selectedCategory);
      }

      const { data: storesData, error: storesError } = await query;
      if (storesError) throw storesError;

      let finalStores = storesData || [];

      // Global Search Logic: Name, Description OR Products
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();

        // 1. Find stores that match directly
        const directMatchIds = finalStores
          .filter(s =>
            s.name.toLowerCase().includes(term) ||
            (s.description && s.description.toLowerCase().includes(term))
          )
          .map(s => s.id);

        // 2. Find products that match and get their store IDs
        const { data: matchedProducts, error: prodError } = await supabase
          .from('products')
          .select('store_id')
          .ilike('name', `%${searchTerm}%`);

        if (prodError) throw prodError;

        const productMatchStoreIds = matchedProducts ? matchedProducts.map(p => p.store_id) : [];

        // 3. Combine both and unique
        const allMatchingIds = [...new Set([...directMatchIds, ...productMatchStoreIds])];

        // If we are already filtering by category, we only want stores in the category
        // that also match the search.
        finalStores = finalStores.filter(s => allMatchingIds.includes(s.id));
      }

      setStores(finalStores);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  // We already filtered during fetch
  const filteredStores = stores;

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Update URL without full navigation
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    navigate(`/stores?${newParams.toString()}`, { replace: true });
  };

  const handleCategoryChange = (slug) => {
    setSelectedCategory(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug !== 'all') {
      newParams.set('category', slug);
    } else {
      newParams.delete('category');
    }
    navigate(`/stores?${newParams.toString()}`, { replace: true });
  };

  const handleStoreClick = (storeId) => {
    navigate(`/stores/${storeId}`);
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tiendas</h1>
          <p className="text-gray-600">Descubre las mejores tiendas cerca de ti</p>
        </div>

        {/* Search Bar */}
        <Card padding="md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Buscar tiendas, productos (hamburguesa, pizza...)"
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Category Filter */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex space-x-3">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all duration-300 ${selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100 hover:shadow-md'
                }`}
            >
              <span className="text-xl">🏪</span>
              <span>Todas</span>
            </button>
            {dbCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.slug)}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all duration-300 ${selectedCategory === category.slug
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100 hover:shadow-md'
                  }`}
              >
                <span className="text-xl">{category.icon_name || '📦'}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="text-sm text-gray-600">
            {filteredStores.length} {filteredStores.length === 1 ? 'tienda encontrada' : 'tiendas encontradas'}
          </div>
        )}

        {/* Stores Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredStores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStores.map((store) => (
              <Card
                key={store.id}
                hover
                onClick={() => handleStoreClick(store.id)}
                padding="none"
                className="overflow-hidden cursor-pointer"
              >
                {/* Store Image */}
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-7xl">🏪</span>
                  )}

                  {/* Status Badge */}
                  {store.is_open !== false && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Abierto
                    </div>
                  )}
                </div>

                {/* Store Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{store.name}</h3>
                    <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-semibold text-gray-900 text-sm">
                        {store.rating ? store.rating.toFixed(1) : '4.5'}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {store.description || 'Descripción no disponible'}
                  </p>

                  {/* Store Details */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-gray-600">
                      <span>⏱️</span>
                      <span>{store.delivery_time || '30-40'} min</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-600">
                      <span>🚚</span>
                      <span className="font-medium">
                        {store.delivery_fee === 0 ? 'Gratis' : `$${store.delivery_fee || '3.000'}`}
                      </span>
                    </div>
                  </div>

                  {/* Store Address */}
                  {store.address && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-start space-x-2 text-xs text-gray-500">
                        <span>📍</span>
                        <span className="line-clamp-1">{store.address}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🔍"
            title={searchTerm ? 'No se encontraron tiendas' : 'No hay tiendas disponibles'}
            message={
              searchTerm
                ? `No encontramos tiendas que coincidan con "${searchTerm}"`
                : 'No hay tiendas disponibles en esta categoría'
            }
          />
        )}
      </div>
    </ClientLayout>
  );
};

export default Stores;
