import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCartContext } from '../../contexts/CartContext';
// IMPORTACIÓN ACTUALIZADA: Añadí 'Tag' para el ícono de la etiqueta
import { ArrowLeft, MapPin, Plus, Minus, Info, X, Store, AlertCircle, MessageCircle, Heart, Eye, Image as ImageIcon, ShoppingCart, Share2, Tag } from 'lucide-react';
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
  
  const [activeStoryIndex, setActiveStoryIndex] = useState(null); 
  const [isPaused, setIsPaused] = useState(false);
  const [likedStories, setLikedStories] = useState(new Set());
  const [fullScreenImage, setFullScreenImage] = useState(null);

  const [viewedStories, setViewedStories] = useState(() => {
    const saved = localStorage.getItem('viewedStories');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

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

  const handleLikeStory = async (offerId, e) => {
    e.stopPropagation();
    if (likedStories.has(offerId)) return;
    setLikedStories(new Set([...likedStories, offerId]));
    toast.success('¡Te gustó esta oferta!', { icon: '❤️', position: 'top-center' });
    const { error } = await supabase.rpc('increment_offer_likes', { offer_id: offerId });
    if (error) console.error("Error al dar like:", error);
  };

  const handleDirectWhatsApp = (item) => {
    if (!store?.phone) return toast.error('Esta tienda no tiene un WhatsApp registrado.');
    const message = `Hola ${store.name}! 👋 Vi esta oferta en la app y me interesa pedir:\n\n*${item.title || item.name}* a $${item.price.toLocaleString()}`;
    const cleanPhone = store.phone.replace(/\D/g, '');
    window.open(`https://wa.me/57${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openStory = async (index) => {
    setActiveStoryIndex(index);
    setIsPaused(false);
    const offerId = flashOffers[index].id;
    const newViewed = new Set(viewedStories).add(offerId);
    setViewedStories(newViewed);
    localStorage.setItem('viewedStories', JSON.stringify([...newViewed]));
    await supabase.rpc('increment_offer_views', { offer_id: offerId });
  };

  const nextStory = () => {
    if (activeStoryIndex < flashOffers.length - 1) openStory(activeStoryIndex + 1);
    else setActiveStoryIndex(null); 
  };

  const prevStory = () => {
    if (activeStoryIndex > 0) openStory(activeStoryIndex - 1);
  };

  const handleShare = async (title, text, customPath = '') => {
    setIsPaused(true); 
    const url = `${window.location.origin}${customPath || window.location.pathname}`;
    
    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({ title, text, url });
        setIsPaused(false); 
      } catch (error) {
        if (error.name !== 'AbortError') fallbackShare(text, url);
        setIsPaused(false);
      }
    } else {
      fallbackShare(text, url);
    }
  };

  const fallbackShare = (text, url) => {
    navigator.clipboard.writeText(`${text} ${url}`);
    alert(`¡Enlace copiado al portapapeles!\n\n(La función de compartir nativa se activará cuando la app esté publicada).`);
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
        <button onClick={(e) => { e.stopPropagation(); handleShare(`Comprar en ${store.name}`, `Mira los productos que tiene ${store.name} en la App. ¡Están increíbles! 🛍️`); }} className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 z-10"><Share2 className="w-5 h-5"/>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
          <div className="w-24 h-24 rounded-2xl shadow-xl border-4 border-white bg-white overflow-hidden shrink-0 transform -translate-y-4 sm:translate-y-0">
            {store.logo_url ? <img src={store.logo_url} className="w-full h-full object-cover" /> : <Store className="w-12 h-12 m-auto text-gray-400 mt-5" />}
          </div>
          <div className="flex-1 -mt-4 sm:mt-0">
            <h1 className="text-3xl font-black text-gray-900 leading-tight">{store.name}</h1>
            <p className="text-gray-500 mt-1 text-sm">{store.description || 'Tienda Aliada'}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${store.is_open_now ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{store.is_open_now ? 'Abierto Ahora' : 'Cerrado'}</span>
              <span className="flex items-center text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full"><MapPin className="w-4 h-4 mr-1 text-orange-500"/> {store.address}</span>
            </div>
          </div>
        </div>

        {store.banner_url_2 && (
          <div className="mt-6">
            <div onClick={() => setFullScreenImage(store.banner_url_2)} className="w-full h-32 sm:h-48 rounded-2xl overflow-hidden shadow-sm border border-gray-200 cursor-pointer group relative bg-gray-100">
              <img src={store.banner_url_2} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 flex items-end p-3">
                 <span className="text-white text-xs font-bold flex items-center gap-1 drop-shadow-md"><ImageIcon className="w-4 h-4"/> Toca para ampliar</span>
              </div>
            </div>
          </div>
        )}

        {flashOffers.length > 0 && (
          <div className="mt-8 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-black text-lg text-gray-900 mb-3 flex items-center gap-2">🔥 Estados y Ofertas</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 pt-2 snap-x hide-scrollbar">
              {flashOffers.map((offer, index) => {
                const isViewed = viewedStories.has(offer.id); 
                return (
                  <div key={offer.id} onClick={() => openStory(index)} className="flex flex-col items-center gap-2 shrink-0 snap-start cursor-pointer group">
                    <div className={`w-20 h-20 rounded-full p-[3px] transform group-hover:scale-105 transition-all shadow-md ${isViewed ? 'bg-gray-300' : 'bg-gradient-to-tr from-orange-500 to-pink-500'}`}>
                      <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                        {offer.image_url ? <img src={offer.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl">🚀</div>}
                      </div>
                    </div>
                    <div className="text-center w-20">
                      <span className={`text-xs truncate block ${isViewed ? 'text-gray-500 font-medium' : 'text-gray-900 font-bold'}`}>{offer.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!store.is_open_now && (
          <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-r-2xl flex items-center gap-3 shadow-sm">
            <Info className="w-6 h-6 shrink-0 text-yellow-600"/>
            <p className="text-sm font-medium">Esta tienda está cerrada por el momento. Puedes ver el menú y armar tu pedido, pero te atenderán cuando abran.</p>
          </div>
        )}

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
                        
                        <div onClick={() => product.image_url && setFullScreenImage(product.image_url)} className="w-28 h-28 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
                          {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform" /> : <Store className="w-8 h-8 m-auto text-gray-300 mt-10"/>}
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-gray-900 leading-tight pr-2 truncate">{product.name}</h3>
                              <button onClick={(e) => { e.stopPropagation(); handleShare(product.name, `Mira este producto: ${product.name} a $${product.price.toLocaleString()} en ${store.name} 🛍️`); }} className="text-gray-400 hover:text-orange-500 p-1 shrink-0">
                                <Share2 className="w-4 h-4"/>
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                          </div>
                          
                          <div className="flex items-end justify-between mt-3">
                            <span className="font-black text-lg text-gray-900">${product.price.toLocaleString()}</span>
                            {quantityInCart > 0 ? (
                              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-1 py-1 shadow-sm">
                                <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, quantityInCart - 1); }} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"><Minus className="w-4 h-4"/></button>
                                <span className="font-bold text-sm w-4 text-center">{quantityInCart}</span>
                                <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/30"><Plus className="w-4 h-4"/></button>
                              </div>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-orange-500 transition-colors shadow-md"><Plus className="w-5 h-5"/></button>
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

      {totalCartItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-40 pointer-events-none flex justify-center animate-in slide-in-from-bottom-5">
          <div onClick={() => navigate('/cart')} className="pointer-events-auto bg-gray-900 hover:bg-black text-white rounded-full px-6 py-4 flex items-center justify-between gap-8 shadow-2xl transform hover:scale-105 transition-all cursor-pointer border border-gray-700 w-full max-w-sm">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-inner">{totalCartItems}</div>
              <span className="font-black text-lg">${totalCartPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-orange-400">Ver Pedido <ShoppingCart className="w-5 h-5"/></div>
          </div>
        </div>
      )}

      {fullScreenImage && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center animate-in fade-in" onClick={() => setFullScreenImage(null)}>
          <button className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full backdrop-blur-md hover:bg-white/30"><X className="w-6 h-6"/></button>
          <img src={fullScreenImage} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
        </div>
      )}

      {/* 🚀 VISOR DE HISTORIAS - DISEÑO INOVADOR "SHOPPING TAG HORIZONTAL" */}
      {activeStoryIndex !== null && flashOffers[activeStoryIndex] && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in zoom-in-95 duration-300 select-none">
          
          <div className="absolute top-2 left-2 right-2 flex gap-1 z-30">
            {flashOffers.map((_, idx) => (
              <div key={idx} className="h-1 bg-white/30 rounded-full overflow-hidden flex-1">
                <div 
                  className="h-full bg-white rounded-full" 
                  onAnimationEnd={() => { if (idx === activeStoryIndex) nextStory(); }}
                  style={{ width: idx < activeStoryIndex ? '100%' : idx === activeStoryIndex ? '100%' : '0%', transition: idx < activeStoryIndex ? 'none' : 'width 5s linear', transformOrigin: 'left', animation: idx === activeStoryIndex ? 'shrinkWidth 5s linear forwards' : 'none', animationPlayState: isPaused ? 'paused' : 'running' }} 
                />
              </div>
            ))}
          </div>

          <div className="px-4 pt-6 pb-12 flex justify-between items-start bg-gradient-to-b from-black/90 via-black/50 to-transparent absolute top-0 w-full z-20 pointer-events-none">
            <div className="flex items-center gap-3 text-white pointer-events-auto">
              <div className="w-11 h-11 rounded-full border-2 border-orange-500 overflow-hidden bg-gray-900 shadow-lg">{store.logo_url && <img src={store.logo_url} className="w-full h-full object-cover" />}</div>
              <div>
                <p className="font-bold text-base shadow-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{store.name}</p>
                <p className="text-xs text-orange-400 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">Oferta Flash ⚡</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pointer-events-auto">
              <button onClick={(e) => { e.stopPropagation(); const currentOffer = flashOffers[activeStoryIndex]; handleShare(`¡Oferta en ${store.name}!`, `Mira esta oferta flash: ${currentOffer.title} por solo $${currentOffer.price.toLocaleString()} 🔥`); }} className="p-2 text-white bg-black/40 rounded-full hover:bg-black/60 backdrop-blur-md border border-white/10"><Share2 className="w-5 h-5"/></button>
              <button onClick={() => setActiveStoryIndex(null)} className="p-2 text-white bg-black/40 rounded-full hover:bg-black/60 backdrop-blur-md border border-white/10"><X className="w-6 h-6"/></button>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative pt-20 pb-32 px-4 w-full h-full cursor-pointer" onPointerDown={() => setIsPaused(true)} onPointerUp={() => setIsPaused(false)} onPointerLeave={() => setIsPaused(false)}>
             <div className="absolute left-0 top-0 bottom-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); prevStory(); }} />
             <div className="absolute right-0 top-0 bottom-0 w-2/3 z-10" onClick={(e) => { e.stopPropagation(); nextStory(); }} />
             <div className="relative z-0 pointer-events-none">
               {flashOffers[activeStoryIndex].image_url && <img src={flashOffers[activeStoryIndex].image_url} className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] pointer-events-auto" />}
             </div>
          </div>
          
          {/* BOTTOM BAR REDISEÑADA - HORIZONTAL, MODERNA Y COMO LA COMPETENCIA */}
          <div className="px-4 pb-8 pt-12 bg-gradient-to-t from-black via-black/80 to-transparent absolute bottom-0 w-full flex flex-col z-20 pointer-events-auto items-center">
            <div className="max-w-md w-full space-y-4">
              
              {/* 1. ETIQUETA HORIZONTAL CENTRADA (Nombre + Precio en una línea) - ¡No arropa nada! */}
              <div className="flex justify-center w-full">
                {/* FIX DESIGN: Ceñido, alineación horizontal y más transparente */}
                <div className="bg-gray-950/40 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10 shadow-lg flex items-center gap-2.5 max-w-[90%] truncate">
                  {/* FIX ICON: 'Tag' en vez de carrito y color naranja */}
                  <Tag className="w-5 h-5 text-orange-400 shrink-0" />
                  
                  {/* Nombre y Precio en una sola línea horizontal */}
                  <div className="flex items-center gap-2 truncate text-white">
                    <span className="font-bold text-sm truncate">{flashOffers[activeStoryIndex].title}</span>
                    <span className="text-gray-400 font-light">|</span> {/* Separador sutil */}
                    <span className="font-black text-sm text-orange-400 shrink-0">
                      ${flashOffers[activeStoryIndex].price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 2. FILA DE BOTONES (WhatsApp + Corazón al lado estilo WA Status) */}
              <div className="flex items-center gap-3 w-full">
                {/* Botón WhatsApp (flex-1 para ocupar espacio) */}
                <button 
                  onClick={() => handleDirectWhatsApp(flashOffers[activeStoryIndex])} 
                  className="flex-1 bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:from-[#1DA851] hover:to-[#158C43] text-white font-black py-4 rounded-2xl shadow-[0_8px_20px_rgba(37,211,102,0.4)] flex justify-center items-center gap-2 active:scale-95 transition-all text-lg border border-green-400/30"
                >
                  <MessageCircle className="w-6 h-6"/> ¡PEDIR AHORA!
                </button>

                {/* El Corazón INDEPENDIENTE flotando al lado del botón verde (no arropado) */}
                <button onClick={(e) => handleLikeStory(flashOffers[activeStoryIndex].id, e)} className="w-14 h-14 shrink-0 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-75 transition-transform border border-white/10 shadow-lg">
                  <Heart className={`w-7 h-7 ${likedStories.has(flashOffers[activeStoryIndex].id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </button>
              </div>

            </div>
          </div>
          <style>{`@keyframes shrinkWidth { from { width: 0%; } to { width: 100%; } }`}</style>
        </div>
      )}
    </div>
  );
};

export default StoreDetail;