import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  User,
  Home,
  Package,
  LogOut,
  ChevronDown,
  Heart,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
// CORRECCIÓN 1: Importamos desde el contexto correcto
import { useCart } from '../../contexts/CartContext';

const ClientLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  
  // CORRECCIÓN 2: Traemos el número total directamente del carrito
  const { totalItems } = useCart();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // CORRECCIÓN 3: Eliminamos la línea const totalItems = getTotalItems(); porque ya no la necesitamos

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/client/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    console.log('[ClientLayout] Logout initiated');
    setShowUserMenu(false);
    await signOut();
    navigate('/auth/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/client', icon: Home, label: 'Inicio' },
    { path: '/client/stores', icon: Search, label: 'Explorar' },
    { path: '/client/orders', icon: Package, label: 'Pedidos' },
    { path: '/client/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/client" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent hidden sm:block">
                Rappi
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-2xl mx-8"
            >
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar productos, tiendas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent focus:bg-white transition-all placeholder:text-gray-400"
                />
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              {/* Cart */}
              <Link
                to="/client/cart"
                className="relative p-2.5 hover:bg-gray-100/80 rounded-xl transition-all group"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700 group-hover:text-orange-500 transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    console.log('[ClientLayout] User menu toggled:', !showUserMenu);
                    setShowUserMenu(!showUserMenu);
                  }}
                  className="flex items-center space-x-2 p-2 pl-3 pr-3 hover:bg-gray-100/80 rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                    <span className="text-white text-sm font-semibold">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <ChevronDown className={`hidden md:block w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden z-50">
                      {/* Profile Header */}
                      <div className="px-4 py-4 bg-gradient-to-br from-orange-50 to-pink-50 border-b border-gray-200/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg font-bold">
                              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {profile?.full_name || 'Usuario'}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {profile?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          to="/client/profile"
                          className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50/80 transition-colors group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <span>Mi Perfil</span>
                        </Link>

                        <Link
                          to="/client/orders"
                          className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50/80 transition-colors group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mr-3 group-hover:bg-purple-100 transition-colors">
                            <Package className="w-4 h-4 text-purple-600" />
                          </div>
                          <span>Mis Pedidos</span>
                        </Link>

                        <button
                          className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50/80 transition-colors group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center mr-3 group-hover:bg-pink-100 transition-colors">
                            <Heart className="w-4 h-4 text-pink-600" />
                          </div>
                          <span>Favoritos</span>
                        </button>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-200/50 py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50/80 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mr-3 group-hover:bg-red-100 transition-colors">
                            <LogOut className="w-4 h-4 text-red-600" />
                          </div>
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar - Mobile */}
          <div className="md:hidden pb-3 pt-1">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar productos, tiendas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent focus:bg-white transition-all placeholder:text-gray-400"
                />
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 z-40">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center space-y-0.5 transition-all ${
                  active
                    ? 'text-orange-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-orange-50' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default ClientLayout;