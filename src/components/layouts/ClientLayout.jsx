import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import { useAuth } from '../../contexts/AuthContext';
import ActiveMandadosModal from '../orders/ActiveMandadosModal';
import { supabase } from '../../lib/supabase';
import AddressModal from '../common/AddressModal';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { ChevronDown, Navigation, Loader2, MapPin, Plus, Home, Trash2, CheckCircle, AlertTriangle, UserPlus, LogIn, Menu, X, Search } from 'lucide-react';

const DEFAULT_COORDS = { latitude: 8.9167, longitude: -75.1833 };

const ClientLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getTotalItems } = useCart();
  const { user, profile, signOut } = useAuth();
  
  const [showMandadosModal, setShowMandadosModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // --- SISTEMA DE UBICACIÓN ESPACIAL ---
  const [coverageAreas, setCoverageAreas] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');

  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const savedLoc = localStorage.getItem('userLocationObj');
      return savedLoc ? JSON.parse(savedLoc) : null; 
    } catch(e) { return null; }
  });

  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  const userMenuRef = useRef(null);
  const cartItemsCount = getTotalItems();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    if (showMobileMenu || showLocationModal) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu, showLocationModal]);

  // Cargar Zonas de Cobertura Oficiales
  const fetchCoverageAreas = async () => {
    try {
      const { data, error } = await supabase.from('coverage_zones').select('*').eq('is_active', true);
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCoverageAreas(data);
        
        let isValidLocation = false;
        if (selectedLocation) {
          isValidLocation = data.some(area => area.id === selectedLocation.id);
        }

        if (!isValidLocation) {
          localStorage.removeItem('userLocationObj');
          setSelectedLocation(null);
          triggerAutoLocation(data);
        }

      } else {
        // Fallback preventivo si no hay zonas configuradas
        const defaults = [{ id: 'galeras', name: 'Galeras', full_name: 'Galeras, Sucre', is_active: true }];
        setCoverageAreas(defaults);
        if (!selectedLocation) triggerAutoLocation(defaults);
      }
    } catch (err) {
      console.error("Error cargando zonas:", err);
    }
  };

  useEffect(() => {
    fetchCoverageAreas();
  }, []);

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    localStorage.setItem('userLocationObj', JSON.stringify(loc));
    window.dispatchEvent(new CustomEvent('locationChanged', { detail: loc }));
    setShowLocationModal(false);
    setSearchLocation('');
  };

  // --- MOTOR ESPACIAL: ALGORITMO DE PUNTO EN POLÍGONO ---
  const isPointInPolygon = (point, polygon) => {
    if (!polygon || polygon.length < 3) return false;
    let x = point.lng, y = point.lat;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      let xi = polygon[i].lng, yi = polygon[i].lat;
      let xj = polygon[j].lng, yj = polygon[j].lat;
      let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const triggerAutoLocation = (areas) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPoint = { lat: position.coords.latitude, lng: position.coords.longitude };
          let matchedArea = null;

          // Cruce matemático de coordenadas GPS vs Polígonos de Supabase
          for (let area of areas) {
            if (area.polygon_coords && Array.isArray(area.polygon_coords)) {
              if (isPointInPolygon(userPoint, area.polygon_coords)) {
                matchedArea = area;
                break;
              }
            }
          }

          if (matchedArea) {
             handleSelectLocation(matchedArea);
             if(isLocating) toast.success(`¡Estás en ${matchedArea.name}!`);
          } else {
             if(isLocating) toast.error("Tu ubicación está fuera de nuestras zonas de cobertura.", { duration: 4000 });
             handleSelectLocation(selectedLocation || areas[0]);
          }
        },
        (err) => {
          if(isLocating) toast.error("No pudimos acceder al GPS. Revisa tus permisos.");
          if(!selectedLocation) handleSelectLocation(areas[0]); 
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } else {
       if(!selectedLocation) handleSelectLocation(areas[0]);
    }
  };

  // FILTRO BUSCADOR SEGURO
  const filteredAreas = coverageAreas.filter(area => {
    const safeName = area.name ? String(area.name).toLowerCase() : '';
    const safeFullName = area.full_name ? String(area.full_name).toLowerCase() : '';
    const safeSearch = searchLocation ? String(searchLocation).toLowerCase() : '';
    
    return safeName.includes(safeSearch) || safeFullName.includes(safeSearch);
  });

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      setAddressLoading(true);
      const { data, error } = await supabase.from('client_addresses').select('*').eq('client_id', user.id).order('is_default', { ascending: false });
      if (error) throw error;
      setAddresses(data || []);
    } catch (error) { console.error(error); } finally { setAddressLoading(false); }
  };

  useEffect(() => {
    if (!user) return;
    fetchAddresses();
    const channel = supabase.channel('client-addresses').on('postgres_changes', { event: '*', schema: 'public', table: 'client_addresses', filter: `client_id=eq.${user.id}` }, () => fetchAddresses()).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const handleSaveAddress = async (data, addressId) => {
    if(!user) return;
    setAddressLoading(true);
    try {
      const payload = { address_name: data.address_name, address_line: data.address_line, instructions: data.instructions, is_default: data.is_default || addresses.length === 0, latitude: data.latitude ?? DEFAULT_COORDS.latitude, longitude: data.longitude ?? DEFAULT_COORDS.longitude, client_id: user.id };
      if (payload.is_default) await supabase.from('client_addresses').update({ is_default: false }).eq('client_id', user.id);

      let error;
      if (addressId) ({ error } = await supabase.from('client_addresses').update(payload).eq('id', addressId));
      else ({ error } = await supabase.from('client_addresses').insert([payload]));

      if (error) throw error;
      toast.success(addressId ? 'Dirección actualizada' : 'Dirección guardada');
      setAddressModalOpen(false);
      setEditingAddress(null);
      await fetchAddresses();
    } catch (error) { toast.error('Error al guardar'); } finally { setAddressLoading(false); }
  };

  const handleDeleteClick = (addr, e) => {
    e.stopPropagation();
    if (addr.is_default) return toast.error('No puedes eliminar tu dirección predeterminada.');
    setAddressToDelete(addr);
    setDeleteModalOpen(true);
  };

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    try {
      setAddressLoading(true);
      await supabase.from('client_addresses').delete().eq('id', addressToDelete.id);
      toast.success('Dirección eliminada');
      await fetchAddresses();
    } catch (error) { toast.error('Error al eliminar'); } finally { setAddressLoading(false); setDeleteModalOpen(false); setAddressToDelete(null); }
  };

  const navItems = [
    { path: '/', label: 'Inicio', icon: '🏠' },
    { path: '/stores', label: 'Tiendas', icon: '🏪' },
    ...(user ? [
      { path: '/favorites', label: 'Favoritos', icon: '❤️' },
      { path: '/orders', label: 'Pedidos', icon: '📦' },
      { path: '/profile', label: 'Perfil', icon: '👤' }
    ] : [])
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    setShowUserMenu(false);
    setShowMobileMenu(false);
    await signOut();
    navigate('/'); 
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ActiveMandadosModal isOpen={showMandadosModal} onClose={() => setShowMandadosModal(false)} />
      
      <header className="bg-white shadow-sm sticky top-0 z-[40]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center flex-1 min-w-0 pr-2 gap-3 sm:gap-6">
              <Link to="/" className="flex items-center shrink-0">
                <img src="/Logo MiCompra1.png" alt="MiCompra" className="h-10 sm:h-14 w-auto object-contain" />
              </Link>
              
              <button onClick={() => setShowLocationModal(true)} className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 py-1.5 px-3 rounded-full border border-gray-100 transition-all active:scale-95">
                <img src="/alfiler.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                <span className="text-[14px] sm:text-[15px] font-black text-gray-900 leading-tight truncate max-w-[120px] sm:max-w-xs">
                  {selectedLocation ? selectedLocation.name : 'Cargando...'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" strokeWidth={3} />
              </button>
            </div>

            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.path) ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <span className="mr-2">{item.icon}</span>{item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-2">
              <button onClick={() => navigate('/cart')} className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {cartItemsCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{cartItemsCount}</span>}
              </button>

              <div ref={userMenuRef} className="hidden md:block relative">
                {user ? (
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center"><span className="text-white font-semibold text-sm">{profile?.full_name?.charAt(0)?.toUpperCase() || '?'}</span></div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                ) : (
                  <Link to="/auth/login" className="ml-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors">Ingresar</Link>
                )}
                
                {showUserMenu && user && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900">{profile?.full_name || 'Usuario'}</p><p className="text-xs text-gray-500 truncate">{user?.email || ''}</p></div>
                    <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"><span>👤</span><span>Mi Perfil</span></Link>
                    <button onClick={handleLogout} className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"><span>🚪</span><span>Cerrar Sesión</span></button>
                  </div>
                )}
              </div>

              <button onClick={() => setShowMobileMenu(true)} className="md:hidden p-2 text-gray-600">
                <Menu className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MODAL CENTRADO CON BUSCADOR */}
      {showLocationModal && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLocationModal(false)} />
          
          <div className="bg-white w-full max-w-[400px] rounded-[32px] shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">¿Dónde estás?</h3>
                  <p className="text-gray-500 text-sm mt-1">Elige tu ciudad para ver los comercios</p>
                </div>
                <button onClick={() => setShowLocationModal(false)} className="p-2.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              {/* Buscador Dinámico */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Busca tu municipio..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-[15px] font-bold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 placeholder:font-medium"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>

              {/* Botón Detectar */}
              <button 
                onClick={() => { setIsLocating(true); triggerAutoLocation(coverageAreas); setTimeout(() => setIsLocating(false), 2000); }}
                className="w-full mb-6 flex items-center gap-4 bg-orange-50 hover:bg-orange-100 p-4 rounded-2xl transition-colors group active:scale-95"
              >
                <div className="bg-orange-500 p-2.5 rounded-full text-white shadow-md group-hover:scale-110 transition-transform">
                  {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5 fill-current" />}
                </div>
                <div className="text-left">
                  <p className="font-bold text-orange-600 text-[15px]">Detectar ubicación actual</p>
                  <p className="text-xs text-orange-500/80 font-medium">Usar GPS del dispositivo</p>
                </div>
              </button>

              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Zonas de cobertura</p>
              
              <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                {filteredAreas.length > 0 ? filteredAreas.map(loc => (
                  <button 
                    key={loc.id} 
                    onClick={() => handleSelectLocation(loc)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-95 ${
                      selectedLocation?.id === loc.id ? 'bg-gray-900 text-white shadow-lg' : 'bg-white hover:bg-gray-50 border border-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-black text-[15px]">{loc.name}</span>
                      {selectedLocation?.id !== loc.id && <span className={`text-[11px] text-gray-400 font-medium`}>{loc.full_name}</span>}
                    </div>
                    {selectedLocation?.id === loc.id && (
                      <div className="bg-white/20 p-1.5 rounded-full">
                        <img src="/alfiler.png" alt="" className="w-4 h-4 object-contain brightness-0 invert" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                      </div>
                    )}
                  </button>
                )) : (
                  // MENSAJE DE SIN COBERTURA MEJORADO
                  <div className="text-center py-8 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 mt-2">
                    <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MapPin className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-[15px] font-bold">Aún no hay disponibilidad de servicio en este municipio</p>
                    <p className="text-gray-400 text-[13px] mt-1.5 font-medium">Estamos trabajando para expandir nuestra cobertura 🛵</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MENÚ MÓVIL BLINDADO CON AUTENTICACIÓN */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-[60]">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowMobileMenu(false)} />
           <div className="absolute inset-y-0 right-0 w-[80%] max-w-sm bg-white shadow-2xl z-[70] animate-in slide-in-from-right flex flex-col">
             
             {/* Header del menú móvil */}
             <div className="p-4 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
               {user ? (
                 <div className="flex items-center gap-3 px-2">
                   <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                     <span className="text-white font-bold">{profile?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                   </div>
                   <div>
                     <p className="text-sm font-bold text-gray-900 line-clamp-1">{profile?.full_name || 'Usuario'}</p>
                     <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                   </div>
                 </div>
               ) : (
                 <span className="font-black text-gray-900 ml-2">Menú Principal</span>
               )}
               <button onClick={() => setShowMobileMenu(false)} className="p-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 shadow-sm"><X className="w-5 h-5" /></button>
             </div>

             {/* Links de Navegación */}
             <div className="px-6 py-4 flex-1 overflow-y-auto">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">Navegación</p>
                  {navItems.map((item) => (
                    <Link key={item.path} to={item.path} onClick={() => setShowMobileMenu(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[15px] font-bold transition-colors ${isActive(item.path) ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                      <span className="text-xl">{item.icon}</span> {item.label}
                    </Link>
                  ))}
                </div>
             </div>

             {/* Footer del menú (Login / Logout) */}
             <div className="p-5 border-t border-gray-100 space-y-3 bg-white">
               {user ? (
                 <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-100">
                   <span>🚪</span> Cerrar Sesión
                 </button>
               ) : (
                 <>
                   <Link to="/auth/login" onClick={() => setShowMobileMenu(false)} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors shadow-md">
                     <LogIn className="w-5 h-5" /> Ingresar
                   </Link>
                   <Link to="/auth/signup" onClick={() => setShowMobileMenu(false)} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200">
                     <UserPlus className="w-5 h-5" /> Crear Cuenta
                   </Link>
                 </>
               )}
             </div>

           </div>
        </div>
      )}

      <main className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-10 min-h-screen relative z-10">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-[40] pb-safe">
        <div className="flex justify-around items-center h-[68px]">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive(item.path) ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}>
              <span className={`text-xl mb-1 ${isActive(item.path) ? 'animate-bounce' : ''}`}>{item.icon}</span>
              <span className={`text-[10px] font-black ${isActive(item.path) ? 'text-orange-500' : ''}`}>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ClientLayout;