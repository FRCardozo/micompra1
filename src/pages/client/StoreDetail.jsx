import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCartContext } from '../../contexts/CartContext';
import { ArrowLeft, MapPin, Plus, Minus, Info, X, Store, AlertCircle, MessageCircle, Heart, Eye, Image as ImageIcon, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

const StoreDetail = () => {
  const params = useParams();
  const id = params.id || params.storeId || params.store_id; 
  const navigate = useNavigate();
  
  const { addToCart, getItemQuantity, updateQuantity, getTotalItems, getTotalPrice } = useCartContext();
  
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [flashOffers, setFlashOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [activeStory, setActiveStory] = useState(null); 
  const [isPaused, setIsPaused] = useState(false);
  const [likedStories, setLikedStories] = useState(new Set());
  const [fullScreenImage, setFullScreenImage] = useState(null);

  useEffect(() => {
    if (id) fetchStoreDetails();
    else { setErrorMessage("No se encontró el ID de la tienda."); setLoading(false); }
  }, [id]);

  const fetchStoreDetails = async () => {
    try {
      setLoading(true);
      const { data: storeData, error: storeError } = await supabase.from('stores').select('*').eq('id', id).single();
      if (storeError) throw new Error(storeError.message);
      if (!storeData) throw new Error('Tienda no encontrada.');
      setStore(storeData);

      await supabase.rpc('increment_store_views', { store_id: id });

      const { data: offersData } = await supabase.from('flash_offers').select('*').eq('store_id', id).eq('is_active', true).gt('expires_at', new Date().toISOString());
      setFlashOffers(offersData || []);

      const { data: productsData } = await supabase.from('products').select('*, store_categories(name)').eq('store_id', id).eq('is_active', true);
      setProducts(productsData || []);

    } catch (error) {
      setErrorMessage(error.message || 'Error al cargar la tienda.');
    } finally {
      setLoading(false); 
    }
  };

  // CORRECCIÓN: Eliminamos el .catch() e hicimos la función async
  const handleLikeStory = async (offer, e) => {
    e.stopPropagation();
    if (likedStories.has(offer.id)) return;
    setLikedStories(new Set([...likedStories, offer.id]));
    toast.success('¡Te gustó esta oferta!', { icon: '❤️', position: 'top-center' });
    await supabase.rpc('increment_offer_likes', { offer_id: offer.id });
  };

  const handleDirectWhatsApp = (item) => {
    if (!store?.phone) return toast.error('Esta tienda no tiene un WhatsApp registrado.');
    const message = `Hola ${store.name}! 👋 Vi esta oferta en la app y me interesa pedir:\n\n*${item.title || item.name}* a $${item.price.toLocaleString()}`;
    const cleanPhone = store.phone.replace(/\D/g, '');
    window.open(`https://wa.me/57${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openStory = async (offer) => {
    setActiveStory(offer);
    setIsPaused(false);
    await supabase.rpc('increment_offer_views', { offer_id: offer.id });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  if (errorMessage) return ( <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center"><AlertCircle className="w-16 h-16 text-red-500 mb-4" /><h2 className="text-xl font-bold text-gray-900 mb-2">Oops... Algo salió mal</h2><p className="text-gray-600 mb-6">{errorMessage}</p><button onClick={() => navigate(-1)} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-md">Volver Atrás</button></div> );
  if (!store) return null;

  const groupedProducts = products.reduce((acc, product) => {
    const catName = product.store_categories?.name || 'Otros';
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(product);
    return acc;
  }, {});

  const totalCartItems = getTotalItems();
  const totalCartPrice = getTotalPrice();

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      
      {/* BANNER 1 (FONDO) */}
      <div className="relative h-48 sm:h-64 bg-gray-900 cursor-pointer" onClick={() => store.banner_url_1 && setFullScreenImage(store.banner_url_1)}>
        {store.banner_url_1 ? (
          <>
            <img src={store.banner_url_1} className="w-full h-full object-cover opacity-70 hover:opacity-90 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
          </>
        ) : (
           <div className="w-full h-full bg-gradient-to-r from-orange-400 to-pink-500 opacity-60"></div>
        )}
        <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 z-10"><ArrowLeft className="w-6 h-6"/></button>
        {store.banner_url_1 && <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs flex items-center gap-1"><Eye className="w-3 h-3"/> Toca para ver</div>}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        
        {/* INFO DE LA TIENDA Y LOGO */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
          <div className="w-24 h-24 rounded-2xl shadow-xl border-4 border-white bg-white overflow-hidden shrink-0 transform -translate-y-4 sm:translate-y-0">
            {store.logo_url ? <img src={store.logo_url} className="w-full h-full object-cover" /> : <Store className="w-12 h-12 m-auto text-gray-400 mt-5" />}
          </div>
          <div className="flex-1 -mt-4 sm:mt-0">
            <h1 className="text-3xl font-black text-gray-900 leading-tight">{store.name}</h1>
            <p className="text-gray-500 mt-1 text-sm">{store.description || 'Tienda Aliada'}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${store.is_open_now ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {store.is_open_now ? 'Abierto Ahora' : 'Cerrado'}
              </span>
              <span className="flex items-center text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full"><MapPin className="w-4 h-4 mr-1 text-orange-500"/> {store.address}</span>
            </div>
          </div>
        </div>

        {/* LA SEGUNDA FOTO: MENÚ, PROMO O DESTACADO GENÉRICO */}
        {store.banner_url_2 && (
          <div className="mt-6">
            <div 
              onClick={() => setFullScreenImage(store.banner_url_2)}
              className="w-full h-32 sm:h-48 rounded-2xl overflow-hidden shadow-sm border border-gray-200 cursor-pointer group relative bg-gray-100"
            >
              <img src={store.banner_url_2} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 flex items-end p-3">
                 <span className="text-white text-xs font-bold flex items-center gap-1 drop-shadow-md">
                   <ImageIcon className="w-4 h-4"/> Toca para ampliar
                 </span>
              </div>
            </div>
          </div>
        )}

        {/* OFERTAS FLASH */}
        {flashOffers.length > 0 && (
          <div className="mt-8 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-black text-lg text-gray-900 mb-3 flex items-center gap-2">🔥 Estados y Ofertas</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 pt-2 snap-x hide-scrollbar">
              {flashOffers.map(offer => (
                <div key={offer.id} onClick={() => openStory(offer)} className="flex flex-col items-center gap-2 shrink-0 snap-start cursor-pointer group">
                  <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-orange-500 to-pink-500 transform group-hover:scale-105 transition-all shadow-md">
                    <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                      {offer.image_url ? <img src={offer.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl">🚀</div>}
                    </div>
                  </div>
                  <div className="text-center w-20">
                    <span className="text-xs font-bold text-gray-900 truncate block">{offer.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALERTA CERRADO */}
        {!store.is_open_now && (
          <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-r-2xl flex items-center gap-3 shadow-sm">
            <Info className="w-6 h-6 shrink-0 text-yellow-600"/>
            <p className="text-sm font-medium">Esta tienda está cerrada por el momento. Puedes ver el menú y armar tu pedido, pero te atenderán cuando abran.</p>
          </div>
        )}

        {/* PRODUCTOS */}
        <div className="mt-8 space-y-10">
          {Object.keys(groupedProducts).length === 0 ? (
            <div className="text-center py-16 text-gray-500 font-medium bg-white rounded-3xl border border-dashed border-gray-300">
              <Store className="w-12 h-12 mx-auto text-gray-300 mb-3"/>
              Aún no hay productos disponibles.
            </div>
          ) : (
            Object.keys(groupedProducts).map(category => (
              <div key={category}>
                <h2 className="text-2xl font-black text-gray-900 mb-4 pl-2">{category}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {groupedProducts[category].map(product => {
                    const quantityInCart = getItemQuantity(product.id);

                    return (
                      <div key={product.id} className={`bg-white rounded-2xl p-4 shadow-sm border flex gap-4 transition-all relative overflow-hidden group cursor-pointer ${quantityInCart > 0 ? 'border-orange-300 bg-orange-50/30 ring-1 ring-orange-200' : 'border-gray-100 hover:shadow-md hover:border-orange-200'}`}>
                        
                        {/* FOTO DEL PRODUCTO (CLIC PARA VER GRANDE) */}
                        <div onClick={() => product.image_url && setFullScreenImage(product.image_url)} className="w-28 h-28 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
                          {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform" /> : <Store className="w-8 h-8 m-auto text-gray-300 mt-10"/>}
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <h3 className="font-bold text-gray-900 leading-tight pr-2">{product.name}</h3>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                          </div>
                          
                          <div className="flex items-end justify-between mt-3">
                            <span className="font-black text-lg text-gray-900">${product.price.toLocaleString()}</span>
                            
                            {/* CONTROLES DE CANTIDAD DINÁMICOS */}
                            {quantityInCart > 0 ? (
                              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-1 py-1 shadow-sm">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, quantityInCart - 1); }} 
                                  className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                ><Minus className="w-4 h-4"/></button>
                                <span className="font-bold text-sm w-4 text-center">{quantityInCart}</span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
                                  className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/30"
                                ><Plus className="w-4 h-4"/></button>
                              </div>
                            ) : (
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  addToCart(product); 
                                  //toast.success('Al carrito', { icon: '🛒', position: 'bottom-center' });
                                }}
                                className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-orange-500 transition-colors shadow-md"
                              >
                                <Plus className="w-5 h-5"/>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BARRA FLOTANTE DEL CARRITO (ESTILO PÍLDORA MODERNA) */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-40 pointer-events-none flex justify-center animate-in slide-in-from-bottom-5">
          <div 
            onClick={() => navigate('/cart')} 
            className="pointer-events-auto bg-gray-900 hover:bg-black text-white rounded-full px-6 py-4 flex items-center justify-between gap-8 shadow-2xl transform hover:scale-105 transition-all cursor-pointer border border-gray-700 w-full max-w-sm"
          >
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-inner">
                {totalCartItems}
              </div>
              <span className="font-black text-lg">${totalCartPrice.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-orange-400">
              Ver Pedido <ShoppingCart className="w-5 h-5"/>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA VER IMÁGENES EN GRANDE */}
      {fullScreenImage && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center animate-in fade-in" onClick={() => setFullScreenImage(null)}>
          <button className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full backdrop-blur-md hover:bg-white/30"><X className="w-6 h-6"/></button>
          <img src={fullScreenImage} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
        </div>
      )}

      {/* VISOR DE HISTORIAS INMERSIVO */}
      {activeStory && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in zoom-in-95 duration-300 select-none">
          
          <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
            <div className="h-1 bg-white/30 rounded-full overflow-hidden flex-1">
              {/* CORRECCIÓN: Evento onAnimationEnd para cerrar automáticamente cuando la barra termine */}
              <div 
                className="h-full bg-white rounded-full" 
                onAnimationEnd={() => setActiveStory(null)}
                style={{ 
                  width: '100%', transition: 'width 5s linear', transformOrigin: 'left', 
                  animation: 'shrinkWidth 5s linear forwards',
                  animationPlayState: isPaused ? 'paused' : 'running' 
                }} 
              />
            </div>
          </div>

          <div className="p-4 pt-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-full border border-orange-500 overflow-hidden bg-gray-900">{store.logo_url && <img src={store.logo_url} className="w-full h-full object-cover" />}</div>
              <div><p className="font-bold text-sm shadow-sm">{store.name}</p><p className="text-[10px] text-gray-300">Oferta Flash ⚡</p></div>
            </div>
            <button onClick={() => setActiveStory(null)} className="p-2 text-white bg-black/40 rounded-full hover:bg-black/60"><X className="w-6 h-6"/></button>
          </div>
          
          <div 
            className="flex-1 flex items-center justify-center relative pt-20 pb-32 px-4 cursor-pointer" 
            onPointerDown={() => setIsPaused(true)}
            onPointerUp={() => setIsPaused(false)}
            onPointerLeave={() => setIsPaused(false)}
          >
             {activeStory.image_url && <img src={activeStory.image_url} className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl" />}
          </div>
          
          <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent absolute bottom-0 w-full flex flex-col items-center">
            
            <div className="flex items-end justify-between w-full max-w-xs mb-4">
              <div>
                <h2 className="text-2xl font-black text-white drop-shadow-md leading-tight">{activeStory.title}</h2>
                <p className="text-3xl font-black text-orange-400 drop-shadow-md">${activeStory.price.toLocaleString()}</p>
              </div>
              
              <button 
                onClick={(e) => handleLikeStory(activeStory, e)} 
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-75 transition-transform"
              >
                <Heart className={`w-6 h-6 ${likedStories.has(activeStory.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
              </button>
            </div>
            
            <button 
              onClick={() => handleDirectWhatsApp(activeStory)}
              className="w-full max-w-xs bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.4)] flex justify-center items-center gap-2 active:scale-95 transition-all"
            >
              <MessageCircle className="w-5 h-5"/> ¡PEDIR POR WHATSAPP!
            </button>
          </div>
          <style>{`@keyframes shrinkWidth { from { width: 0%; } to { width: 100%; } }`}</style>
        </div>
      )}
    </div>
  );
};

export default StoreDetail;