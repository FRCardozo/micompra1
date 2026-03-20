import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import { useAuth } from '../../contexts/AuthContext';
import ActiveMandadosModal from '../orders/ActiveMandadosModal';
import { supabase } from '../../lib/supabase';
import AddressModal from '../common/AddressModal';
import toast from 'react-hot-toast';

const DEFAULT_COORDS = { latitude: 8.9167, longitude: -75.1833 };

const ClientLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getTotalItems } = useCart();
  const { user, profile, signOut } = useAuth();
  const [showMandadosModal, setShowMandadosModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const userMenuRef = useRef(null);

  const cartItemsCount = getTotalItems();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      setAddressLoading(true);
      const { data, error } = await supabase
        .from('client_addresses')
        .select('*')
        .eq('client_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('[ClientLayout] Error fetching addresses:', error);
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAddresses();

    const channel = supabase
      .channel('client-addresses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_addresses', filter: `client_id=eq.${user.id}` },
        () => fetchAddresses()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSaveAddress = async (data, addressId) => {
    setAddressLoading(true);

    try {
      const payload = {
        address_name: data.address_name,
        address_line: data.address_line,
        instructions: data.instructions,
        is_default: data.is_default || addresses.length === 0,
        latitude: data.latitude ?? DEFAULT_COORDS.latitude,
        longitude: data.longitude ?? DEFAULT_COORDS.longitude,
        client_id: user.id,
      };

      if (payload.is_default) {
        await supabase
          .from('client_addresses')
          .update({ is_default: false })
          .eq('client_id', user.id);
      }

      let error;
      if (addressId) {
        ({ error } = await supabase
          .from('client_addresses')
          .update(payload)
          .eq('id', addressId));
      } else {
        ({ error } = await supabase
          .from('client_addresses')
          .insert([payload]));
      }

      if (error) throw error;

      toast.success(addressId ? 'Dirección actualizada' : 'Dirección guardada');
      setAddressModalOpen(false);
      setEditingAddress(null);
      await fetchAddresses();
    } catch (error) {
      console.error('[ClientLayout] Error saving address:', error);
      toast.error('Error al guardar la dirección');
    } finally {
      setAddressLoading(false);
    }
  };

  const navItems = [
    { path: '/', label: 'Inicio', icon: '🏠' },
    { path: '/stores', label: 'Tiendas', icon: '🏪' },
    { path: '/orders', label: 'Pedidos', icon: '📦' },
    { path: '/profile', label: 'Perfil', icon: '👤' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    setShowUserMenu(false);
    setShowMobileMenu(false);
    await signOut();
    navigate('/auth/login');
  };

  const showLocationBanner =
    !!user &&
    !addressLoading &&
    (addresses.length === 0 || !addresses.some((addr) => addr.is_default));

  const defaultAddress = addresses.find(a => a.is_default) || addresses[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <ActiveMandadosModal
        isOpen={showMandadosModal}
        onClose={() => setShowMandadosModal(false)}
      />
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo y Ubicación Estilo Rappi */}
            <div className="flex items-center space-x-2">
              <Link to="/" className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-lg">R</span>
              </Link>
              
              {user ? (
                <div 
                  className="flex flex-col cursor-pointer ml-1"
                  onClick={() => {
                    setEditingAddress(null);
                    setAddressModalOpen(true);
                  }}
                >
                  <div className="flex items-center text-sm font-extrabold text-gray-900">
                    <span className="text-orange-600 mr-1 text-base">📍</span>
                    <span className="truncate max-w-[140px] sm:max-w-[200px]">
                      {defaultAddress ? (defaultAddress.address_name || defaultAddress.address_line) : 'Agregar dirección'}
                    </span>
                    <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  <span className="text-xs text-gray-500 ml-6 -mt-0.5">{defaultAddress ? 'Galeras, Sucre' : 'Toca para configurar'}</span>
                </div>
              ) : (
                <Link to="/" className="text-xl font-bold text-gray-900">
                  Rappi Clone
                </Link>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Cart Button & User Menu */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowMandadosModal(true)}
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                title="Mandados Activos"
              >
                <span className="text-xl">🛵</span>
              </button>
              <button
                onClick={() => navigate('/cart')}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              {/* User Menu - Desktop */}
              <div ref={userMenuRef} className="hidden md:block relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{profile?.full_name || 'Usuario'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>👤</span>
                      <span>Mi Perfil</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <span>🚪</span>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <div className="md:hidden py-4 border-t">
              <div className="px-4 py-3 mb-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{profile?.full_name || 'Usuario'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                  </div>
                </div>
              </div>

              <nav className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}

                <button
                  onClick={() => {
                    setShowMandadosModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left"
                >
                  <span className="mr-2">🛵</span>
                  Mandados Activos
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-2"
                >
                  <span className="mr-2">🚪</span>
                  Cerrar Sesión
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Soft prompt for location */}
      {showLocationBanner && (
        <div className="sticky top-16 z-40 bg-blue-50 border-b border-blue-100">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3 text-gray-800">
              <span className="text-xl">📍</span>
              <p className="text-sm sm:text-base font-medium">
                Para mostrarte los mejores comercios, necesitamos tu ubicación.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingAddress(null);
                setAddressModalOpen(true);
              }}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              Configurar ubicación
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-10 xl:p-12 min-h-[calc(100vh-4rem)] overflow-x-hidden">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive(item.path)
                ? 'text-blue-600'
                : 'text-gray-500'
                }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16" />

      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => {
          setAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        editingAddress={editingAddress}
      />
    </div>
  );
};

export default ClientLayout;