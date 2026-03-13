import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Store,
  Truck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const StoreLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(5);
  const [notifications, setNotifications] = useState(7);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      path: '/store',
      icon: LayoutDashboard,
      label: 'Dashboard',
    },
    {
      path: '/store/orders',
      icon: Package,
      label: 'Pedidos',
      badge: pendingOrders,
    },
    {
      path: '/store/products',
      icon: ShoppingBag,
      label: 'Productos',
    },
    {
      path: '/store/profile',
      icon: User,
      label: 'Perfil',
    },
    {
      path: '/store/drivers',
      icon: Truck,
      label: 'Mis Repartidores',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                {sidebarOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>

              {/* Store Logo & Name */}
              <Link to="/store" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-bold text-gray-900">
                    {profile?.store_name || 'Mi Tienda'}
                  </span>
                  <p className="text-xs text-gray-500">Panel de Administración</p>
                </div>
              </Link>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Pending Orders Indicator */}
              {pendingOrders > 0 && (
                <Link
                  to="/store/orders"
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-xl font-medium hover:bg-orange-200 transition-all"
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {pendingOrders} {pendingOrders === 1 ? 'pedido' : 'pedidos'}
                  </span>
                  <span className="sm:hidden font-bold">{pendingOrders}</span>
                </Link>
              )}

              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-50 rounded-xl transition-colors">
                <Bell className="w-6 h-6 text-gray-700" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {notifications > 9 ? '9+' : notifications}
                  </span>
                )}
              </button>

              {/* User Avatar */}
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {profile?.full_name?.charAt(0) || 'T'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen sticky top-16">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${active
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Sidebar - Mobile */}
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className="lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-50 overflow-y-auto">
              <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${active
                        ? 'bg-purple-50 text-purple-600'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </nav>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-12 overflow-x-hidden">
          <div className="max-w-screen-2xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default StoreLayout;
