import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClientLayout from '../../components/layouts/ClientLayout';
import { Card, Button, LoadingSpinner, Rating, Modal } from '../../components/common';
import { supabase } from '../../lib/supabase';
import useCart from '../../hooks/useCart';

const StoreDetail = () => {
  const { storeId: id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInCart, getItemQuantity, updateQuantity, removeFromCart } = useCart();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddedNotification, setShowAddedNotification] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (id) {
      fetchStoreDetails();
      fetchProducts();
    }
  }, [id]);

  const fetchStoreDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setStore(data);
    } catch (error) {
      console.error('Error fetching store details:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(name)
        `)
        .eq('store_id', id)
        .eq('is_available', true);

      if (error) throw error;

      const productsData = data || [];
      setProducts(productsData);

      // Derive categories from product data (using names)
      const uniqueCategoryNames = [
        ...new Set(
          productsData
            .map((p) => p.category?.name || 'Sin categoría')
        )
      ];
      setCategories(['all', ...uniqueCategoryNames]);

    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      store_id: store.id,
      store_name: store.name,
    });

    // Show notification
    setShowAddedNotification(true);
    setTimeout(() => setShowAddedNotification(false), 2000);
  };

  const handleUpdateQuantity = (productId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  // Get unique categories from products
  // Removed local categories constant since it's now state-based
  const [categories, setCategories] = useState(['all']);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => (p.category?.name || 'Sin categoría') === selectedCategory);

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const categoryName = product.category?.name || 'Sin categoría';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {});

  if (!store && !loading) {
    return (
      <ClientLayout>
        <Card padding="lg" className="text-center">
          <span className="text-6xl mb-4 block">🏪</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tienda no encontrada</h2>
          <p className="text-gray-600 mb-4">La tienda que buscas no existe o no está disponible</p>
          <Button onClick={() => navigate('/stores')}>
            Volver a tiendas
          </Button>
        </Card>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      {loading && !store ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => navigate('/stores')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Volver</span>
          </button>

          {/* Store Banner */}
          <Card padding="none" className="overflow-hidden">
            {/* Store Image */}
            <div className="h-64 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
              {store?.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-9xl">🏪</span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <h1 className="text-4xl font-bold mb-2">{store?.name}</h1>
                <p className="text-white/90">{store?.description}</p>
              </div>
            </div>

            {/* Store Info */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <span className="text-yellow-500 text-xl">⭐</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {store?.rating ? store.rating.toFixed(1) : '4.5'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Calificación</p>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <span className="text-xl">⏱️</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {store?.delivery_time || '30-40'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">min</p>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <span className="text-xl">🚚</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {store?.delivery_fee === 0 ? 'Gratis' : `$${store?.delivery_fee || '3.000'}`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Envío</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center justify-center mb-1">
                    <span className="text-2xl font-bold text-green-600">
                      {store?.is_open !== false ? 'Abierto' : 'Cerrado'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Estado</p>
                </div>
              </div>

              {store?.address && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl flex items-start space-x-3">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="font-medium text-gray-900">Dirección</p>
                    <p className="text-sm text-gray-600">{store.address}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Category Filter */}
          {categories.length > 1 && (
            <div className="overflow-x-auto pb-2">
              <div className="flex space-x-3">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                  >
                    {category === 'all' ? 'Todos' : category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : Object.keys(productsByCategory).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                <div key={category}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{category}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryProducts.map((product) => (
                      <Card
                        key={product.id}
                        padding="none"
                        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                        onClick={() => setSelectedProduct(product)}
                      >
                        {/* Product Image */}
                        <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-5xl">📦</span>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {product.description}
                            </p>
                          )}

                          {/* Price and Add Button */}
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-gray-900">
                              ${product.price?.toLocaleString()}
                            </span>
                            {isInCart(product.id) ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateQuantity(product.id, getItemQuantity(product.id), -1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-bold text-gray-700"
                                >
                                  -
                                </button>
                                <span className="font-bold text-gray-900 w-6 text-center">
                                  {getItemQuantity(product.id)}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateQuantity(product.id, getItemQuantity(product.id), 1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                                variant="primary"
                              >
                                + Agregar
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card padding="lg" className="text-center">
              <span className="text-6xl mb-4 block">📦</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay productos disponibles
              </h3>
              <p className="text-gray-600">
                Esta tienda no tiene productos disponibles en este momento
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Added to Cart Notification */}
      {showAddedNotification && (
        <div className="fixed bottom-24 md:bottom-8 right-4 z-50 animate-slide-up">
          <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-3">
            <span className="text-xl">✓</span>
            <span className="font-medium">Producto agregado al carrito</span>
          </div>
        </div>
      )}
      {/* Product Detail Modal */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name}
      >
        <div className="space-y-6">
          <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
            {selectedProduct?.image_url ? (
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-8xl">📦</span>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct?.name}</h3>
            <p className="text-gray-600 leading-relaxed">{selectedProduct?.description || 'Sin descripción disponible.'}</p>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <span className="text-3xl font-bold text-blue-600">
              ${selectedProduct?.price?.toLocaleString()}
            </span>

            {selectedProduct && (
              isInCart(selectedProduct.id) ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-4 bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => handleUpdateQuantity(selectedProduct.id, getItemQuantity(selectedProduct.id), -1)}
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors font-bold text-xl"
                    >
                      -
                    </button>
                    <span className="font-bold text-xl text-gray-900 w-8 text-center">
                      {getItemQuantity(selectedProduct.id)}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(selectedProduct.id, getItemQuantity(selectedProduct.id), 1)}
                      className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-bold text-xl"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  size="lg"
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                  }}
                >
                  Agregar al carrito
                </Button>
              )
            )}
          </div>
        </div>
      </Modal>
    </ClientLayout>
  );
};

export default StoreDetail;
