import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, User, LogOut, Bell, Menu, X, Store, Truck, MessageCircle, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const StoreLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null);
  
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    if (profile?.id) fetchStoreAndListen();
  }, [profile]);

  const fetchStoreAndListen = async () => {
    const { data: storeData } = await supabase.from('stores').select('id, name, logo_url, whatsapp_clicks, daily_views').eq('owner_id', profile.id).single();
    
    if (storeData) {
      setStoreInfo(storeData);

      // CONEXIÓN EN TIEMPO REAL: ¡Avisar cuando alguien interactúa con la tienda!
      const subscription = supabase.channel('store_metrics_channel')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stores', filter: `id=eq.${storeData.id}` }, 
          (payload) => {
            // Si los clics de WhatsApp subieron
            if (payload.new.whatsapp_clicks > payload.old.whatsapp_clicks) {
              toast.success('¡Alguien quiere comprar! Revisa tu WhatsApp 💬', { duration: 5000, icon: '🔥' });
              setUnreadNotifications(prev => prev + 1);
              setRecentNotifications(prev => [{ id: Date.now(), text: `¡Un cliente hizo clic para ir a tu WhatsApp!`, time: 'Ahora mismo' }, ...prev]);
            }
          }
        ).subscribe();

      return () => { supabase.removeChannel(subscription); };
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const isActive = (path) => location.pathname === path;

  // MENÚ ADAPTADO A LA FASE 1
  const navItems = [
    { path: '/store', icon: LayoutDashboard, label: 'Métricas & Estados' },
    { path: '/store/products', icon: ShoppingBag, label: 'Mi Catálogo' },
    { path: '/store/orders', icon: MessageCircle, label: 'Cotizaciones (WhatsApp)' },
    { path: '/store/profile', icon: User, label: 'Perfil de Tienda' },
    // Ocultamos "Repartidores" temporalmente si no se usan en Fase 1, o lo dejamos si ya lo usas.
    { path: '/store/drivers', icon: Truck, label: 'Mis Repartidores' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-50 rounded-xl">
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <Link to="/store" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden shadow-md">
                   {storeInfo?.logo_url ? <img src={storeInfo.logo_url} className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-white" />}
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-black text-gray-900">{storeInfo?.name || 'Mi Negocio'}</span>
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1"><Activity className="w-3 h-3"/> Tienda Conectada</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              {/* CAMPANITA INTELIGENTE */}
              <div className="relative">
                <button onClick={() => { setNotificationsOpen(!notificationsOpen); setUnreadNotifications(0); }} className="relative p-2 hover:bg-gray-50 rounded-xl transition-colors">
                  <Bell className={`w-6 h-6 ${unreadNotifications > 0 ? 'text-green-600 animate-bounce' : 'text-gray-700'}`} />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-40 overflow-hidden animate-in slide-in-from-top-2">
                      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-black text-sm text-gray-900">Actividad de tu Tienda</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {recentNotifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-500 text-sm">Todo tranquilo por ahora. Sube un estado para atraer clientes.</div>
                        ) : (
                          recentNotifications.map((notif, i) => (
                            <div key={i} className="p-4 border-b border-gray-50 hover:bg-green-50 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0"><MessageCircle className="w-4 h-4"/></div>
                                <div>
                                  <p className="text-[13px] font-bold text-gray-900">{notif.text}</p>
                                  <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="w-10 h-10 rounded-full border-2 border-gray-100 overflow-hidden bg-gray-50 shadow-sm">
                {storeInfo?.logo_url ? <img src={storeInfo.logo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">{storeInfo?.name?.charAt(0) || 'U'}</div>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col">
          <nav className="p-4 space-y-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path} className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${isActive(item.path) ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <div className="flex items-center space-x-3"><Icon className="w-5 h-5" /><span>{item.label}</span></div>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-100">
            <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-all"><LogOut className="w-5 h-5" /><span>Cerrar Sesión</span></button>
          </div>
        </aside>

        {sidebarOpen && (
          <>
            <div className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-white z-50 overflow-y-auto flex flex-col">
              <nav className="p-4 space-y-2 flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${isActive(item.path) ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <div className="flex items-center space-x-3"><Icon className="w-5 h-5" /><span>{item.label}</span></div>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-gray-100"><button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-red-600 hover:bg-red-50"><LogOut className="w-5 h-5" /><span>Cerrar Sesión</span></button></div>
            </aside>
          </>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50/50"><div className="max-w-screen-2xl mx-auto">{children}</div></main>
      </div>
    </div>
  );
};

export default StoreLayout;