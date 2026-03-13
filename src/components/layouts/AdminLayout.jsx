import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Truck,
  Package,
  Tag,
  Headphones,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Palette,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../hooks/useBranding';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { branding } = useBranding();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Generate breadcrumbs from current path
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Admin', path: '/admin' }];

    paths.forEach((path, index) => {
      if (index > 0) {
        const label = path.charAt(0).toUpperCase() + path.slice(1);
        const fullPath = '/' + paths.slice(0, index + 1).join('/');
        breadcrumbs.push({ label, path: fullPath });
      }
    });

    return breadcrumbs;
  };

  const navSections = [
    {
      title: 'Principal',
      items: [
        {
          path: '/admin',
          icon: LayoutDashboard,
          label: 'Dashboard',
        },
      ],
    },
    {
      title: 'Gestión',
      items: [
        {
          path: '/admin/users',
          icon: Users,
          label: 'Usuarios',
        },
        {
          path: '/admin/stores',
          icon: Store,
          label: 'Tiendas',
        },
        {
          path: '/admin/store-management',
          icon: Store,
          label: 'Gestión Tiendas',
        },
        {
          path: '/admin/drivers',
          icon: Truck,
          label: 'Domiciliarios',
        },
        {
          path: '/admin/orders',
          icon: Package,
          label: 'Pedidos',
        },
        {
          path: '/admin/coupons',
          icon: Tag,
          label: 'Cupones',
        },
      ],
    },
    {
      title: 'Sistema',
      items: [
        {
          path: '/admin/coverage',
          icon: MapPin,
          label: 'Cobertura',
        },
        {
          path: '/admin/support',
          icon: Headphones,
          label: 'Soporte',
        },
        {
          path: '/admin/config',
          icon: Settings,
          label: 'Configuración',
        },
        {
          path: '/admin/branding',
          icon: Palette,
          label: 'Branding',
        },
      ],
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

              {/* Logo - Only show on mobile */}
              <Link to="/admin" className="lg:hidden flex items-center space-x-2">
                {branding?.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: branding?.colors?.primary || '#6366f1' }}
                  >
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                )}
              </Link>

              {/* Breadcrumbs - Desktop */}
              <nav className="hidden lg:flex items-center space-x-2 text-sm">
                {getBreadcrumbs().map((crumb, index) => (
                  <div key={crumb.path} className="flex items-center space-x-2">
                    {index > 0 && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <Link
                      to={crumb.path}
                      className={`${index === getBreadcrumbs().length - 1
                          ? 'text-gray-900 font-medium'
                          : 'text-gray-500 hover:text-gray-700'
                        } transition-colors`}
                    >
                      {crumb.label}
                    </Link>
                  </div>
                ))}
              </nav>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Admin Badge */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Super Admin</span>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.full_name || 'Administrador'}
                  </p>
                  <p className="text-xs text-gray-500">{profile?.email}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-medium">
                    {profile?.full_name?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-72 bg-white border-r border-gray-200 min-h-screen sticky top-16">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-200">
            <Link to="/admin" className="flex items-center space-x-3">
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
              ) : (
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: branding?.colors?.primary || '#6366f1' }}
                >
                  <Shield className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <span className="text-xl font-bold text-gray-900">
                  {branding?.appName || 'MiCompra'} Admin
                </span>
                <p className="text-xs text-gray-500">Panel de Control</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
            {navSections.map((section) => (
              <div key={section.title}>
                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${active
                            ? 'text-gray-700 hover:bg-gray-50'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        style={active ? {
                          backgroundColor: `${branding?.colors?.primary || '#6366f1'}15`,
                          color: branding?.colors?.primary || '#6366f1'
                        } : {}}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Logout */}
            <div className="pt-4 border-t border-gray-200">
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
            <aside className="lg:hidden fixed left-0 top-16 bottom-0 w-72 bg-white border-r border-gray-200 z-50 overflow-y-auto">
              {/* Logo Section */}
              <div className="p-6 border-b border-gray-200">
                <Link to="/admin" className="flex items-center space-x-3">
                  {branding?.logoUrl ? (
                    <img src={branding.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: branding?.colors?.primary || '#6366f1' }}
                    >
                      <Shield className="w-7 h-7 text-white" />
                    </div>
                  )}
                  <div>
                    <span className="text-xl font-bold text-gray-900">
                      {branding?.appName || 'MiCompra'} Admin
                    </span>
                    <p className="text-xs text-gray-500">Panel de Control</p>
                  </div>
                </Link>
              </div>

              {/* Navigation */}
              <nav className="p-4 space-y-6">
                {navSections.map((section) => (
                  <div key={section.title}>
                    <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${active
                                ? 'text-gray-700 hover:bg-gray-50'
                                : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            style={active ? {
                              backgroundColor: `${branding?.colors?.primary || '#6366f1'}15`,
                              color: branding?.colors?.primary || '#6366f1'
                            } : {}}
                          >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Logout */}
                <div className="pt-4 border-t border-gray-200">
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

export default AdminLayout;
