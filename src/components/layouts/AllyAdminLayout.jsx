import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Store,
    ShoppingBag,
    Truck,
    User,
    LogOut,
    Menu,
    X,
    Bell,
    Settings,
    Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const AllyAdminLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const { profile } = useAuth();

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/ally-admin' },
        { name: 'Mi Tienda', icon: Store, path: '/ally-admin/store' },
        { name: 'Mis Mandados', icon: ShoppingBag, path: '/ally-admin/orders' },
        { name: 'Mis Repartidores', icon: Truck, path: '/ally-admin/drivers' },
        { name: 'Configuración', icon: Settings, path: '/ally-admin/settings' },
    ];

    useEffect(() => {
        if (profile?.id) {
            fetchNotifications();
            const subscription = subscribeToNotifications();
            return () => {
                subscription.unsubscribe();
            };
        }
    }, [profile?.id]);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.is_read).length || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const subscribeToNotifications = () => {
        return supabase
            .channel(`notifications:${profile.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${profile.id}`
            }, (payload) => {
                setNotifications(prev => [payload.new, ...prev].slice(0, 10));
                setUnreadCount(prev => prev + 1);
                toast.success(payload.new.title || 'Nueva notificación');
            })
            .subscribe();
    };

    const markAsRead = async (id) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
            {/* Sidebar for desktop */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-30">
                <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <h1 className="text-2xl font-bold text-orange-600">Aliado Admin</h1>
                    </div>
                    <div className="mt-8 flex-grow flex flex-col">
                        <nav className="flex-1 px-2 space-y-1">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                            ? 'bg-orange-50 text-orange-600'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <Icon
                                            className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-500'
                                                }`}
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* User Profile Summary */}
                    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                        <Link to="/ally-admin/settings" className="flex-shrink-0 w-full group block">
                            <div className="flex items-center">
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 text-truncate max-w-[180px]">
                                        {profile?.full_name || 'Usuario'}
                                    </p>
                                    <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                                        Ver perfil
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </div>

                    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                        <button
                            onClick={handleLogout}
                            className="flex-shrink-0 w-full group flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                            <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile sidebar */}
            {sidebarOpen && (
                <div className="lg:hidden">
                    <div className="fixed inset-0 flex z-40">
                        <div
                            className="fixed inset-0 bg-gray-600 bg-opacity-75"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                            <div className="absolute top-0 right-0 -mr-12 pt-2">
                                <button
                                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <X className="h-6 w-6 text-white" />
                                </button>
                            </div>
                            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                                <div className="flex-shrink-0 flex items-center px-4">
                                    <h1 className="text-2xl font-bold text-orange-600">Aliado Admin</h1>
                                </div>
                                <nav className="mt-5 px-2 space-y-1">
                                    {menuItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive
                                                    ? 'bg-orange-50 text-orange-600'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                            >
                                                <Icon
                                                    className={`mr-4 flex-shrink-0 h-6 w-6 ${isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-500'
                                                        }`}
                                                />
                                                {item.name}
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                                <button
                                    onClick={handleLogout}
                                    className="flex-shrink-0 w-full group flex items-center text-base font-medium text-gray-600 hover:text-gray-900"
                                >
                                    <LogOut className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="lg:pl-64 flex flex-col flex-1 relative min-h-screen">
                {/* Top bar */}
                <div className="sticky top-0 z-20 flex-shrink-0 flex h-16 bg-white shadow">
                    <button
                        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="flex-1 px-2 sm:px-4 flex justify-between items-center min-w-0">
                        {/* Left side */}
                        <div className="flex-1 min-w-0"></div>

                        {/* Right side icons */}
                        <div className="ml-2 sm:ml-4 flex items-center md:ml-6 space-x-2 sm:space-x-4 flex-shrink-0">
                            <div className="relative">
                                <button
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 relative"
                                >
                                    <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 block h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-red-500 ring-2 ring-white text-[8px] sm:text-[10px] text-white flex items-center justify-center font-bold">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {notificationsOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setNotificationsOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-40 overflow-hidden">
                                            <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                                <h3 className="font-bold text-sm text-gray-900">Notificaciones</h3>
                                                {unreadCount > 0 && (
                                                    <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">
                                                        {unreadCount} nuevas
                                                    </span>
                                                )}
                                            </div>
                                            <div className="max-h-96 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-gray-500 text-sm">
                                                        No tienes notificaciones
                                                    </div>
                                                ) : (
                                                    notifications.map((n) => (
                                                        <div
                                                            key={n.id}
                                                            className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors relative ${!n.is_read ? 'bg-orange-50/30' : ''}`}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="font-bold text-xs text-gray-900">{n.title}</h4>
                                                                {!n.is_read && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            markAsRead(n.id);
                                                                        }}
                                                                        className="text-orange-600 hover:text-orange-700"
                                                                        title="Marcar como leída"
                                                                    >
                                                                        <Check className="h-3 w-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-gray-600 mt-1">{n.message}</p>
                                                            <p className="text-[9px] text-gray-400 mt-2">
                                                                {new Date(n.created_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div className="p-2 border-t border-gray-100 text-center">
                                                <button className="text-[11px] text-orange-600 font-bold hover:underline">
                                                    Ver todas las notificaciones
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                    {profile?.full_name?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 xl:p-12">
                    <div className="max-w-screen-2xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AllyAdminLayout;
