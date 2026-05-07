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
  MapPin,
  ShieldAlert, // Ícono para la moderación
  Activity // Ícono para métricas de visitas
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

  // EL NUEVO MENÚ POTENCIADO
  const navSections = [
    {
      title: 'Comando Central',
      items: [
        {
          path: '/admin',
          icon: LayoutDashboard,
          label: 'Dashboard General',
        },
        {
          path: '/admin/metrics',
          icon: Activity,
          label: 'Rendimiento y Visitas',
        },
      ],
    },
    {
      title: 'Control Operativo',
      items: [
        {
          path: '/admin/users',
          icon: Users,
          label: 'Usuarios y Roles',
        },
        {
          path: '/admin/store-requests', // Nueva ruta para aprobar tiendas
          icon: Store,
          label: 'Solicitudes de Tiendas',
        },
        {
          path: '/admin/store-management',
          icon: Store,
          label: 'Comercios Activos',
        },
        {
          path: '/admin/drivers',
          icon: Truck,
          label: 'Domiciliarios',
        },
        {
          path: '/admin/orders',
          icon: Package,
          label: 'Monitor de Pedidos',
        },
      ],
    },
    {
      title: 'Seguridad y Ley',
      items: [
        {
          path: '/admin/moderation',
          icon: ShieldAlert,
          label: 'Moderación de Productos',
        },
      ],
    },
    {
      title: 'Infraestructura',
      items: [
        {
          path: '/admin/coverage',
          icon: MapPin,
          label: 'Zonas de Servicio',
        },
        {
          path: '/admin/coupons',
          icon: Tag,
          label: 'Cupones Goblales',
        },
        {
          path: '/admin/support',
          icon: Headphones,
          label: 'Tickets de Soporte',
        },
        {
          path: '/admin/branding',
          icon: Palette,
          label: 'Branding App',
        },
        {
          path: '/admin/config',
          icon: Settings,
          label: 'Configuración API',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
              </button>

              <Link to="/admin" className="lg:hidden flex items-center space-x-2">
                {branding?.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: branding?.colors?.primary || '#6366f1' }}
                  >
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                )}
              </Link>

              {/* Breadcrumbs - Desktop */}
              <nav className="hidden lg:flex items-center space-x-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                {getBreadcrumbs().map((crumb, index) => (
                  <div key={crumb.path} className="flex items-center space-x-2">
                    {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <Link
                      to={crumb.path}
                      className={`${index === getBreadcrumbs().length - 1
                          ? 'text-gray-900 font-bold'
                          : 'text-gray-500 hover:text-gray-900'
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
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-red-50 border border-red-100 text-red-700 rounded-lg shadow-sm">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-bold tracking-wide">Acceso Total</span>
              </div>

              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-bold text-gray-900">{profile?.full_name || 'Administrador'}</p>
                  <p className="text-xs text-gray-500 font-medium">{profile?.email}</p>
                </div>
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ backgroundImage: `linear-gradient(135deg, ${branding?.colors?.primary || '#6366f1'}, #000000)` }}
                >
                  <span className="text-white font-bold text-lg">{profile?.full_name?.charAt(0) || 'A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16 shadow-lg z-30">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <Link to="/admin" className="flex items-center space-x-3">
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="w-12 h-12 object-contain drop-shadow-sm" />
              ) : (
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
                  style={{ backgroundColor: branding?.colors?.primary || '#6366f1' }}
                >
                  <Shield className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <span className="text-xl font-black text-gray-900 tracking-tight leading-none block mb-0.5">
                  {branding?.appName || 'MiCompra'}
                </span>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest bg-gray-200 px-1.5 py-0.5 rounded">
                  Workspace
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            {navSections.map((section) => (
              <div key={section.title} className="mb-6">
                <h3 className="px-4 mb-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">
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
                        className="flex items-center space-x-3 px-4 py-2.5 rounded-xl font-bold text-[14px] transition-all group"
                        style={active ? {
                          backgroundColor: `${branding?.colors?.primary || '#6366f1'}15`,
                          color: branding?.colors?.primary || '#6366f1',
                          borderLeft: `4px solid ${branding?.colors?.primary || '#6366f1'}`
                        } : {
                          color: '#4B5563',
                          borderLeft: '4px solid transparent'
                        }}
                      >
                        <Icon className={`w-5 h-5 ${active ? '' : 'group-hover:text-gray-900 transition-colors'}`} />
                        <span className={`${active ? '' : 'group-hover:text-gray-900 transition-colors'}`}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-bold text-red-600 hover:bg-red-100 transition-colors border border-red-100 shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión Segura</span>
            </button>
          </div>
        </aside>

        {/* Sidebar - Mobile (Queda Igual en Lógica, Mejorado Visualmente) */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-[80%] max-w-sm bg-white border-r border-gray-200 shadow-2xl flex flex-col animate-in slide-in-from-left">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <Link to="/admin" className="flex items-center space-x-3" onClick={() => setSidebarOpen(false)}>
                  {branding?.logoUrl ? (
                    <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: branding?.colors?.primary || '#6366f1' }}>
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <span className="text-xl font-black text-gray-900">{branding?.appName || 'MiCompra'}</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="p-2 bg-gray-200 rounded-full text-gray-600"><X className="w-5 h-5"/></button>
              </div>

              <nav className="flex-1 p-4 overflow-y-auto">
                {navSections.map((section) => (
                  <div key={section.title} className="mb-6">
                    <h3 className="px-4 mb-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">{section.title}</h3>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className="flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-[15px] transition-all"
                            style={active ? { backgroundColor: `${branding?.colors?.primary || '#6366f1'}15`, color: branding?.colors?.primary || '#6366f1' } : { color: '#4B5563' }}
                          >
                            <Icon className="w-5 h-5" /><span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="p-4 border-t border-gray-100">
                <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-4 rounded-xl font-bold text-red-600 bg-red-50 transition-colors">
                  <LogOut className="w-5 h-5" /><span>Cerrar Sesión</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          <div className="max-w-screen-2xl mx-auto">{children}</div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #d1d5db; }
      `}</style>
    </div>
  );
};

export default AdminLayout;