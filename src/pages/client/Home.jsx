import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom'; 
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../components/layouts/ClientLayout';
import { LoadingSpinner } from '../../components/common';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCartContext } from '../../contexts/CartContext';
import { useFavorites } from '../../hooks/useFavorites';
import AuthModal from '../../components/common/AuthModal';
import { 
  Search, Star, Clock, ChevronRight, ChevronLeft, Utensils, ShoppingBag, 
  Pill, Bone, Smartphone, Shirt, Home as HomeIcon, 
  HeartPulse, Flame, X, Plus, Award, Heart, Tag, MessageCircle, Share2, 
  Zap, Sparkles, Moon
} from 'lucide-react';
import toast from 'react-hot-toast';

const Home = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth(); 
  const { addToCart } = useCartContext(); 
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const [showAuthModal, setShowAuthModal] = useState(false);

  const requireAuth = (callback) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    callback();
  };
  
  // LECTURA DE UBICACIÓN CORREGIDA (Evita pantalla blanca)
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const savedLoc = localStorage.getItem('userLocationObj');
      return savedLoc ? JSON.parse(savedLoc) : { id: 'galeras', name: 'Galeras' };
    } catch(e) { return { id: 'galeras', name: 'Galeras' }; }
  });

  useEffect(() => {
    const handleLocationChange = (e) => setSelectedLocation(e.detail);
    window.addEventListener('locationChanged', handleLocationChange);
    return () => window.removeEventListener('locationChanged', handleLocationChange);
  }, []);

  const [stores, setStores] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [groupedStories, setGroupedStories] = useState([]);
  const [activeStoreIndex, setActiveStoreIndex] = useState(null); 
  const [activeOfferIndex, setActiveOfferIndex] = useState(0); 
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [marketingContext, setMarketingContext] = useState({});
  
  const storiesContainerRef = useRef(null);
  const spotlightRef = useRef(null);
  const categoriesRef = useRef(null);
  const trendingRef = useRef(null);
  const storesRef = useRef(null);

  const [likedStories, setLikedStories] = useState(() => {
    const saved = localStorage.getItem('likedStories');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [viewedStories, setViewedStories] = useState(() => {
    const saved = localStorage.getItem('viewedStories');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const categoryIcons = {
    food: <Utensils strokeWidth={1.5} />, supermarket: <ShoppingBag strokeWidth={1.5} />,
    pharmacy: <Pill strokeWidth={1.5} />, pet: <Bone strokeWidth={1.5} />,
    electronics: <Smartphone strokeWidth={1.5} />, fashion: <Shirt strokeWidth={1.5} />,
    home: <HomeIcon strokeWidth={1.5} />, health: <HeartPulse strokeWidth={1.5} />,
  };

  const updateMarketingContext = useCallback(() => {
    const hour = new Date().getHours();
    const locName = selectedLocation?.name || 'tu zona';
    if (hour >= 6 && hour < 12) {
      setMarketingContext({
        title: `Descubre lo Nuevo en ${locName}`,
        badgeText: "NUEVO",
        icon: <Sparkles className="w-5 h-5 text-blue-600 fill-blue-600" />,
        bgIcon: "bg-blue-100",
        badgeBg: "bg-blue-500",
        badgeBorder: "border-blue-400",
        badgeIcon: <Sparkles className="w-3 h-3 fill-white text-white animate-pulse" />
      });
    } else if (hour >= 12 && hour < 18) {
      setMarketingContext({
        title: `Top Ventas en ${locName}`,
        badgeText: "POPULAR",
        icon: <Zap className="w-5 h-5 text-orange-600 fill-orange-600" />,
        bgIcon: "bg-orange-100",
        badgeBg: "bg-yellow-400",
        badgeBorder: "border-yellow-300",
        badgeIcon: <Zap className="w-3 h-3 fill-white text-white animate-pulse" />
      });
    } else {
      setMarketingContext({
        title: `Para tu Antojo en ${locName}`,
        badgeText: "ANTOJO",
        icon: <Moon className="w-5 h-5 text-purple-600 fill-purple-600" />,
        bgIcon: "bg-purple-100",
        badgeBg: "bg-purple-500",
        badgeBorder: "border-purple-400",
        badgeIcon: <Star className="w-3 h-3 fill-white text-white animate-pulse" />
      });
    }
  }, [selectedLocation?.name]);

  useEffect(() => {
    fetchData();
    updateMarketingContext(); 
    const timeInterval = setInterval(updateMarketingContext, 60000);

    const channelStores = supabase.channel('home_stores')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stores' }, (payload) => {
          setStores(current => current.map(s => s.id === payload.new.id ? { ...s, is_open_now: payload.new.is_open_now } : s).sort((a, b) => Number(b.is_open_now) - Number(a.is_open_now)));
      }).subscribe();

    // ERROR DE LAS HISTORIAS CORREGIDO: 
    // Ahora solo escucha si se CREADA o ELIMINADA una oferta.
    // Ignora los "Updates" de vistas, así no te cierra la historia en la cara.
    const channelOffers = supabase.channel('home_offers')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'flash_offers' }, () => fetchFlashOffers())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'flash_offers' }, () => fetchFlashOffers())
      .subscribe();

    return () => {
      clearInterval(timeInterval);
      supabase.removeChannel(channelStores);
      supabase.removeChannel(channelOffers);
    };
  }, [updateMarketingContext]); 

  const scrollContainer = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth > 600 ? 600 : ref.current.clientWidth - 50;
      ref.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (trendingProducts.length === 0) return; 
    const interval = setInterval(() => {
      if (spotlightRef.current && !isStoryPaused) {
        const container = spotlightRef.current;
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 4000); 
    return () => clearInterval(interval);
  }, [trendingProducts, isStoryPaused]);

  useEffect(() => {
    let scrollInterval;
    const container = storiesContainerRef.current;
    if (groupedStories.length > 4 && container) {
      scrollInterval = setInterval(() => {
        if (!isStoryPaused) {
          container.scrollLeft += 1; 
          if (container.scrollLeft >= container.scrollWidth / 2) {
            container.scrollLeft = 0;
          }
        }
      }, 50);
    }
    return () => clearInterval(scrollInterval);
  }, [groupedStories.length, isStoryPaused]);

  const fetchFlashOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('flash_offers')
        .select('*, stores(name, logo_url, phone)')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true }); 

      if (error) throw error;
      
      const groups = {};
      (data || []).forEach(offer => {
        if (!groups[offer.store_id]) {
          groups[offer.store_id] = { store_id: offer.store_id, store: offer.stores, offers: [], allViewed: true };
        }
        groups[offer.store_id].offers.push(offer);
        if (!viewedStories.has(offer.id)) { groups[offer.store_id].allViewed = false; }
      });

      const sortedGroups = Object.values(groups).sort((a, b) => Number(a.allViewed) - Number(b.allViewed));
      setGroupedStories(sortedGroups);
    } catch (err) { console.error("Error cargando historias:", err); }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: storesData } = await supabase.from('stores').select('*').eq('status', 'active');
      const sorted = (storesData || []).sort((a, b) => Number(b.is_open_now) - Number(a.is_open_now));
      setStores(sorted.slice(0, 8));
      await fetchFlashOffers();
      const { data: productsData } = await supabase.from('products').select('*, stores(name)').eq('is_active', true).limit(10);
      setTrendingProducts(productsData || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) navigate(`/stores?search=${encodeURIComponent(searchTerm)}&location=${selectedLocation?.id}`);
  };

  const registerStoryView = async (offerId, storeId) => {
    if (!viewedStories.has(offerId)) {
      const newViewed = new Set(viewedStories).add(offerId);
      setViewedStories(newViewed);
      localStorage.setItem('viewedStories', JSON.stringify([...newViewed]));
      await supabase.rpc('increment_offer_views', { offer_id: offerId });
      await supabase.rpc('increment_daily_metric', { target_store_id: storeId, metric_column: 'story_views' });
    }
  };

  const openStoreStories = (storeIndex) => {
    setActiveStoreIndex(storeIndex);
    const group = groupedStories[storeIndex];
    if(!group) return;

    const firstUnviewedIndex = group.offers.findIndex(o => !viewedStories.has(o.id));
    const startOfferIndex = firstUnviewedIndex === -1 ? 0 : firstUnviewedIndex;
    
    setActiveOfferIndex(startOfferIndex);
    setIsStoryPaused(false);
    registerStoryView(group.offers[startOfferIndex].id, group.store_id);
  };

  const nextStory = () => {
    const currentGroup = groupedStories[activeStoreIndex];
    if (activeOfferIndex < currentGroup.offers.length - 1) {
      const nextIndex = activeOfferIndex + 1;
      setActiveOfferIndex(nextIndex);
      registerStoryView(currentGroup.offers[nextIndex].id, currentGroup.store_id);
    } else if (activeStoreIndex < groupedStories.length - 1) {
      const nextStoreIdx = activeStoreIndex + 1;
      setActiveStoreIndex(nextStoreIdx);
      setActiveOfferIndex(0); 
      registerStoryView(groupedStories[nextStoreIdx].offers[0].id, groupedStories[nextStoreIdx].store_id);
    } else { closeViewer(); }
  };

  const prevStory = () => {
    if (activeOfferIndex > 0) setActiveOfferIndex(activeOfferIndex - 1);
    else if (activeStoreIndex > 0) {
      const prevStoreIdx = activeStoreIndex - 1;
      setActiveStoreIndex(prevStoreIdx);
      setActiveOfferIndex(groupedStories[prevStoreIdx].offers.length - 1);
    }
  };

  const closeViewer = () => {
    setActiveStoreIndex(null);
    setActiveOfferIndex(0);
    fetchFlashOffers();
  };

  const handleLikeStory = async (offerId, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (likedStories.has(offerId)) return;
    const newLiked = new Set(likedStories).add(offerId);
    setLikedStories(newLiked);
    localStorage.setItem('likedStories', JSON.stringify([...newLiked]));
    toast.success('¡Te gustó esta oferta!', { icon: '❤️', position: 'top-center' });
    await supabase.rpc('increment_offer_likes', { offer_id: offerId });
  };

  const handleDirectWhatsApp = async (offer) => {
    if (!offer.stores?.phone) return toast.error('Esta tienda no tiene un WhatsApp registrado.');
    await supabase.rpc('increment_whatsapp_clicks', { store_id: offer.store_id });
    await supabase.rpc('increment_daily_metric', { target_store_id: offer.store_id, metric_column: 'whatsapp_clicks' });
    const message = `Hola ${offer.stores.name}! 👋 Vi esta oferta en la app y me interesa pedir:\n\n*${offer.title}* a $${offer.price.toLocaleString()}`;
    const cleanPhone = offer.stores.phone.replace(/\D/g, '');
    window.open(`https://wa.me/57${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShare = async (title, text, customPath = '') => {
    setIsStoryPaused(true); 
    const url = `${window.location.origin}${customPath || window.location.pathname}`;
    if (navigator.share && window.isSecureContext) {
      try { await navigator.share({ title, text, url }); setIsStoryPaused(false); } 
      catch (error) { if (error.name !== 'AbortError') fallbackShare(text, url); setIsStoryPaused(false); }
    } else { fallbackShare(text, url); }
  };

  const fallbackShare = (text, url) => {
    navigator.clipboard.writeText(`${text} \n\n${url}`);
    toast.success('¡Enlace copiado al portapapeles!');
    setIsStoryPaused(false);
  };

  const getTimeRemaining = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return 'Expirando...';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const cleanCategories = [
    { slug: 'food', name: 'Restaurantes' }, { slug: 'supermarket', name: 'Mercados' },
    { slug: 'pharmacy', name: 'Farmacias' }, { slug: 'pet', name: 'Mascotas' },
    { slug: 'fashion', name: 'Moda' }, { slug: 'electronics', name: 'Tecnología' },
    { slug: 'home', name: 'Hogar' }, { slug: 'health', name: 'Salud' },
  ];

  const currentGroup = activeStoreIndex !== null ? groupedStories[activeStoreIndex] : null;
  const currentOffer = currentGroup ? currentGroup.offers[activeOfferIndex] : null;

  return (
    <ClientLayout>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <div className="pb-8 space-y-7 max-w-screen-xl mx-auto mt-2 overflow-hidden">
        
        {/* BUSCADOR Y SALUDO */}
        <section className="px-4 sm:px-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-[28px] sm:text-3xl font-black text-gray-900 tracking-tight leading-none">
                Hola, {profile?.full_name?.split(' ')[0] || 'bienvenido'} 👋
              </h1>
              <p className="italic text-gray-500 mt-1.5 font-medium text-sm">
                Estás en las tiendas de <span className="text-orange-500 font-bold">{selectedLocation?.name || 'Cargando...'}</span>
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="relative group shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" strokeWidth={2.5} />
            </div>
            <input 
              type="text" 
              placeholder={`¿Qué se te antoja hoy en ${selectedLocation?.name || 'tu ciudad'}?`} 
              className="w-full bg-white text-gray-900 pl-12 pr-4 py-3.5 rounded-2xl text-[15px] font-bold border border-gray-100 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all placeholder:text-gray-400" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </form>
        </section>

        {/* HISTORIAS (OFERTAS FLASH) */}
        {groupedStories.length > 0 && (
          <section className="px-0 sm:px-0">
            <div className="flex items-center gap-2 mb-3 px-4 sm:px-0">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Ofertas Flash</h2>
            </div>
            <div className="relative group/nav">
              <button onClick={() => scrollContainer(storiesContainerRef, 'left')} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center text-gray-700 hover:text-orange-500 hover:scale-110 transition-all opacity-0 group-hover/nav:opacity-100 border border-gray-100">
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div ref={storiesContainerRef} className="flex gap-4 overflow-x-auto hide-scrollbar px-4 sm:px-0 pb-2 scroll-smooth" onPointerDown={() => setIsStoryPaused(true)} onPointerUp={() => setIsStoryPaused(false)} onPointerLeave={() => setIsStoryPaused(false)}>
                {(groupedStories.length > 4 ? [...groupedStories, ...groupedStories] : groupedStories).map((group, index) => {
                  const realIndex = groupedStories.length > 0 ? index % groupedStories.length : index; 
                  return (
                    <button key={`${group.store_id}-${index}`} onClick={() => openStoreStories(realIndex)} className="flex flex-col items-center gap-1.5 shrink-0 group outline-none">
                      <div className={`w-[72px] h-[72px] rounded-full p-[3px] transition-transform active:scale-95 shadow-md ${group.allViewed ? 'bg-gray-300' : 'bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-500'}`}>
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                          <img src={group.store?.logo_url || '/placeholder.png'} className="w-full h-full object-cover" alt="" />
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold w-16 truncate text-center group-hover:text-orange-600 transition-colors ${group.allViewed ? 'text-gray-500 font-medium' : 'text-gray-900'}`}>{group.store?.name || 'Tienda'}</span>
                    </button>
                  );
                })}
              </div>

              <button onClick={() => scrollContainer(storiesContainerRef, 'right')} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center text-gray-700 hover:text-orange-500 hover:scale-110 transition-all opacity-0 group-hover/nav:opacity-100 border border-gray-100">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </section>
        )}

        {/* SECCIÓN DINÁMICA DE MARKETING */}
        {trendingProducts.length > 0 && marketingContext.title && (
          <section className="px-0 sm:px-0" onMouseEnter={() => setIsStoryPaused(true)} onMouseLeave={() => setIsStoryPaused(false)}>
            <div className="flex items-center gap-2 mb-4 px-4 sm:px-0 transition-all duration-500">
               <div className={`${marketingContext.bgIcon} p-1.5 rounded-lg transition-colors duration-500`}>
                 {marketingContext.icon}
               </div>
               <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{marketingContext.title}</h2>
            </div>
            
            <div className="relative group/nav">
              <button onClick={() => scrollContainer(spotlightRef, 'left')} className="hidden md:flex absolute left-2 top-1/3 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-xl items-center justify-center text-gray-700 hover:text-orange-500 hover:scale-110 transition-all opacity-0 group-hover/nav:opacity-100 border border-gray-100">
                <ChevronLeft className="w-7 h-7" />
              </button>

              <div ref={spotlightRef} className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar px-4 sm:px-0 snap-x pb-8 scroll-smooth py-2">
                {trendingProducts.slice(0, 8).map((product) => (
                  <div 
                    key={`spotlight-${product.id}`}
                    className="min-w-[200px] sm:min-w-[240px] max-w-[240px] shrink-0 snap-start bg-white rounded-[32px] shadow-[0_10px_25px_rgba(0,0,0,0.08)] border border-gray-50 flex flex-col overflow-hidden cursor-pointer transform hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition-all duration-300 group" 
                    onClick={() => navigate(`/stores/${product.store_id}`)}
                  >
                      <div className="h-44 sm:h-52 w-full relative overflow-hidden">
                        <img src={product.image_url || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name}/>
                        <div className={`absolute top-3 left-3 flex items-center gap-1 ${marketingContext.badgeBg} px-2.5 py-1 rounded-full shadow-md z-10 border ${marketingContext.badgeBorder} transition-colors duration-500`}>
                           {marketingContext.badgeIcon}
                           <span className="text-[10px] font-black uppercase tracking-tight text-white">{marketingContext.badgeText}</span>
                        </div>
                        <button onClick={(e) => { if (!user) { e.stopPropagation(); setShowAuthModal(true); return; } toggleFavorite(product.id, e); }} className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm active:scale-75"><Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'fill-red-500 text-red-500' : ''}`} /></button>
                        <button onClick={(e) => { e.stopPropagation(); requireAuth(() => { addToCart(product); toast.success('Al carrito'); }); }} className="absolute bottom-3 right-3 z-10 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 active:scale-90 transition-all border-2 border-white"><Plus className="w-6 h-6" strokeWidth={3} /></button>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate mb-1">{product.stores?.name}</span>
                        <h3 className="text-[15px] sm:text-base font-black text-gray-900 leading-tight line-clamp-2 mb-2 flex-1">{product.name}</h3>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="font-black text-gray-900 text-lg sm:text-xl">${product.price.toLocaleString()}</span>
                          <button onClick={(e) => { e.stopPropagation(); handleShare(product.name, `¡Mira esto en la app!`, `/stores/${product.store_id}`); }} className="p-2 text-gray-400 hover:text-orange-500 transition-colors"><Share2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                  </div>
                ))}
              </div>

              <button onClick={() => scrollContainer(spotlightRef, 'right')} className="hidden md:flex absolute right-2 top-1/3 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-xl items-center justify-center text-gray-700 hover:text-orange-500 hover:scale-110 transition-all opacity-0 group-hover/nav:opacity-100 border border-gray-100">
                <ChevronRight className="w-7 h-7" />
              </button>
            </div>
          </section>
        )}

        {/* CATEGORÍAS */}
        <section className="px-0 sm:px-0 pt-1">
          <div className="relative group/nav">
            <button onClick={() => scrollContainer(categoriesRef, 'left')} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow text-gray-600 hover:text-orange-500 items-center justify-center transition-all opacity-0 group-hover/nav:opacity-100 border border-gray-100"><ChevronLeft className="w-5 h-5"/></button>
            <div ref={categoriesRef} className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar px-4 sm:px-0 snap-x scroll-smooth">
              {cleanCategories.map((cat) => (
                <button key={cat.slug} onClick={() => navigate(`/stores?category=${cat.slug}`)} className="flex flex-col items-center shrink-0 snap-start group outline-none gap-2 min-w-[65px] py-2">
                  <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-[1.25rem] flex items-center justify-center text-gray-600 group-hover:text-orange-500 group-hover:bg-orange-50 group-hover:-translate-y-1 transition-all duration-300">
                    {React.cloneElement(categoryIcons[cat.slug] || <ShoppingBag strokeWidth={1.5}/>, { className: "w-7 h-7" })}
                  </div>
                  <span className="font-bold text-gray-600 text-[12px] text-center tracking-tight group-hover:text-gray-900 transition-colors">{cat.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => scrollContainer(categoriesRef, 'right')} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow text-gray-600 hover:text-orange-500 items-center justify-center transition-all opacity-0 group-hover/nav:opacity-100 border border-gray-100"><ChevronRight className="w-5 h-5"/></button>
          </div>
        </section>

        {/* TENDENCIAS EXTRAS */}
        {trendingProducts.length > 0 && (
          <section className="px-0 sm:px-0 pt-4">
             <div className="flex justify-between items-end mb-4 px-4 sm:px-0">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1.5"><Flame className="w-6 h-6 text-orange-500 fill-orange-500" /> Descubre más</h2>
             </div>
             
             <div className="relative group/nav">
               <button onClick={() => scrollContainer(trendingRef, 'left')} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center text-gray-700 hover:text-orange-500 hover:scale-110 transition-all opacity-0 group-hover/nav:opacity-100 border border-gray-100"><ChevronLeft className="w-6 h-6" /></button>
               <div ref={trendingRef} className="flex gap-4 sm:gap-5 overflow-x-auto hide-scrollbar px-4 sm:px-0 snap-x pb-4 scroll-smooth py-1">
                 {trendingProducts.slice(6).map((product) => (
                   <div key={`trend-${product.id}`} className="min-w-[160px] max-w-[160px] sm:min-w-[180px] sm:max-w-[180px] shrink-0 snap-start bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden group hover:shadow-md transition-shadow">
                     <div className="h-32 sm:h-36 w-full bg-gray-100 relative cursor-pointer" onClick={() => navigate(`/stores/${product.store_id}`)}>
                       <button onClick={(e) => { if (!user) { e.stopPropagation(); setShowAuthModal(true); return; } toggleFavorite(product.id, e); }} className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm opacity-100 sm:opacity-0 group-hover:opacity-100"><Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'fill-red-500 text-red-500' : ''}`} /></button>
                       <img src={product.image_url || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     </div>
                     <div className="p-3 flex flex-col flex-1">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate mb-0.5">{product.stores?.name}</span>
                       <h3 className="text-[13px] sm:text-sm font-bold text-gray-900 leading-tight line-clamp-2 mb-1 flex-1">{product.name}</h3>
                       <div className="flex items-center justify-between mt-auto">
                         <span className="font-black text-gray-900 text-[16px]">${product.price.toLocaleString()}</span>
                         <button onClick={(e) => { e.stopPropagation(); requireAuth(() => { addToCart(product); toast.success('Agregado'); }); }} className="w-8 h-8 bg-gray-900 hover:bg-orange-500 text-white rounded-full flex items-center justify-center transition-colors shadow-sm active:scale-95"><Plus className="w-5 h-5" strokeWidth={3} /></button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
               <button onClick={() => scrollContainer(trendingRef, 'right')} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center text-gray-700 hover:text-orange-500 hover:scale-110 transition-all opacity-0 group-hover/nav:opacity-100 border border-gray-100"><ChevronRight className="w-6 h-6" /></button>
             </div>
          </section>
        )}

        {/* TIENDAS TOP */}
        <section className="px-0 sm:px-0 pt-4">
          <div className="flex justify-between items-end mb-4 px-4 sm:px-0">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1.5">Tiendas top <Award className="w-6 h-6 text-orange-500 fill-orange-500" /></h2>
            <button onClick={() => navigate('/stores')} className="text-orange-500 font-bold text-sm hover:underline mb-0.5">Ver todos</button>
          </div>
          {loading ? <div className="flex justify-center py-12"><LoadingSpinner /></div> : (
            <div className="relative group/nav">
              <button onClick={() => scrollContainer(storesRef, 'left')} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center text-gray-700 hover:text-orange-500 hover:scale-110 transition-all opacity-0 group-hover/nav:opacity-100 border border-gray-100"><ChevronLeft className="w-6 h-6" /></button>
              <div ref={storesRef} className="flex gap-4 sm:gap-6 overflow-x-auto hide-scrollbar px-4 sm:px-0 snap-x pb-4 scroll-smooth py-1">
                {stores.map((store) => (
                  <div key={store.id} className="min-w-[260px] max-w-[260px] sm:min-w-[300px] sm:max-w-[300px] shrink-0 snap-start relative group">
                    <button onClick={() => navigate(`/stores/${store.id}`)} className="bg-transparent text-left flex flex-col h-full w-full outline-none">
                      <div className="h-44 w-full relative overflow-hidden rounded-[24px] mb-3 border border-gray-100 shadow-sm">
                        <img src={store.banner_url_1 || store.logo_url} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!store.is_open_now ? 'grayscale opacity-60' : ''}`} /> 
                        {!store.is_open_now && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center"><span className="bg-gray-900 text-white text-[11px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest">Cerrado</span></div>}
                      </div>
                      <div className="flex-1 flex flex-col pr-2 pl-2">
                        <h3 className="font-black text-gray-900 text-[17px] leading-tight truncate">{store.name}</h3>
                        <p className="text-[13px] text-gray-500 truncate mb-2">{store.description || 'Tienda aliada'}</p>
                        <div className="flex items-center gap-3 mt-auto">
                          <span className="flex items-center gap-1 text-[13px] font-bold text-gray-800"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> {store.rating?.toFixed(1) || '4.5'}</span>
                          <span className="flex items-center gap-1 text-[13px] font-medium text-gray-500"><Clock className="w-3.5 h-3.5" /> {store.delivery_time || '30-45'} min</span>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => scrollContainer(storesRef, 'right')} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center text-gray-700 hover:text-orange-500 hover:scale-110 transition-all opacity-0 group-hover/nav:opacity-100 border border-gray-100"><ChevronRight className="w-6 h-6" /></button>
            </div>
          )}
        </section>
      </div>

      {/* --- VISOR GLOBAL DE HISTORIAS CON PORTALS --- */}
      {currentGroup && currentOffer && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in zoom-in-95 duration-300 select-none">
          <div className="absolute top-2 left-2 right-2 flex gap-1 z-30">
            {currentGroup.offers.map((_, idx) => (
              <div key={idx} className="h-1 bg-white/30 rounded-full overflow-hidden flex-1">
                <div 
                  className="h-full bg-white rounded-full" 
                  onAnimationEnd={() => { if (idx === activeOfferIndex) nextStory(); }}
                  style={{ width: idx < activeOfferIndex ? '100%' : idx === activeOfferIndex ? '100%' : '0%', transition: idx < activeOfferIndex ? 'none' : 'width 5s linear', transformOrigin: 'left', animationName: idx === activeOfferIndex ? 'shrinkWidth' : 'none', animationDuration: '5s', animationTimingFunction: 'linear', animationFillMode: 'forwards', animationPlayState: isStoryPaused ? 'paused' : 'running' }} 
                />
              </div>
            ))}
          </div>

          <div className="px-4 pt-6 pb-12 flex justify-between items-start bg-gradient-to-b from-black/90 via-black/50 to-transparent absolute top-0 w-full z-20 pointer-events-none">
            <div className="flex items-center gap-3 text-white pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/stores/${currentGroup.store_id}`); closeViewer(); }}>
              <div className="w-11 h-11 rounded-full border-2 border-orange-500 overflow-hidden bg-gray-900 shadow-lg">{currentGroup.store?.logo_url && <img src={currentGroup.store.logo_url} className="w-full h-full object-cover" />}</div>
              <div>
                <p className="font-bold text-base shadow-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{currentGroup.store?.name}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-orange-400 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">Oferta Flash ⚡</p>
                  <span className="text-[10px] text-white/80 font-medium drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] flex items-center gap-0.5">• ⏱️ Termina en {getTimeRemaining(currentOffer.expires_at)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pointer-events-auto">
              <button onClick={(e) => { e.stopPropagation(); handleShare(`¡Oferta en ${currentGroup.store?.name}!`, `¡Mira esta oferta flash! 🔥`, `/stores/${currentGroup.store_id}`); }} className="p-2 text-white bg-black/40 rounded-full hover:bg-black/60 backdrop-blur-md border border-white/10"><Share2 className="w-5 h-5"/></button>
              <button onClick={(e) => { e.stopPropagation(); closeViewer(); }} className="p-2 text-white bg-black/40 rounded-full hover:bg-black/60 backdrop-blur-md border border-white/10"><X className="w-6 h-6"/></button>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative pt-20 pb-32 px-4 w-full h-full cursor-pointer" onPointerDown={() => setIsStoryPaused(true)} onPointerUp={() => setIsStoryPaused(false)} onPointerLeave={() => setIsStoryPaused(false)}>
             <div className="absolute left-0 top-0 bottom-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); prevStory(); }} />
             <div className="absolute right-0 top-0 bottom-0 w-2/3 z-10" onClick={(e) => { e.stopPropagation(); nextStory(); }} />
             <div className="relative z-0 pointer-events-none">
               {currentOffer.image_url && <img src={currentOffer.image_url} className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] pointer-events-auto border border-white/10" />}
             </div>
          </div>
          
          <div className="px-4 pb-8 pt-12 bg-gradient-to-t from-black via-black/80 to-transparent absolute bottom-0 w-full flex flex-col z-20 pointer-events-auto items-center" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <div className="max-w-md w-full space-y-4">
              <div className="flex flex-col items-center gap-2 w-full">
                {(currentOffer.stock > 0 && currentOffer.stock <= 10) && (
                  <span className="bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.6)] flex items-center gap-1"><Flame className="w-3 h-3 fill-current"/> ¡Solo quedan {currentOffer.stock}!</span>
                )}
                <div className="bg-gray-950/40 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10 shadow-lg flex items-center gap-2.5 max-w-[90%] truncate">
                  <Tag className="w-5 h-5 text-orange-400 shrink-0" />
                  <div className="flex items-center gap-2 truncate text-white">
                    <span className="font-bold text-sm truncate">{currentOffer.title}</span><span className="text-gray-400 font-light">|</span><span className="font-black text-sm text-orange-400 shrink-0">${currentOffer.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full">
                <button onClick={() => requireAuth(() => handleDirectWhatsApp(currentOffer))} className="flex-1 bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:from-[#1DA851] hover:to-[#158C43] text-white font-black py-4 rounded-2xl shadow-[0_8px_20px_rgba(37,211,102,0.4)] flex justify-center items-center gap-2 active:scale-95 transition-all text-lg border border-green-400/30"><MessageCircle className="w-6 h-6"/> ¡PEDIR AHORA!</button>
                <button onClick={(e) => {
                  if (!user) { e.stopPropagation(); setShowAuthModal(true); return; }
                  handleLikeStory(currentOffer.id, e);
                }} className="w-14 h-14 shrink-0 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-75 transition-transform border border-white/10 shadow-lg"><Heart className={`w-7 h-7 ${likedStories.has(currentOffer.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} /></button>
              </div>
            </div>
          </div>
          <style>{`@keyframes shrinkWidth { from { width: 0%; } to { width: 100%; } }`}</style>
        </div>
      , document.body)}

      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </ClientLayout>
  );
};

export default Home;