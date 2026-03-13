import { useState, useEffect } from 'react';
import AllyAdminLayout from '../../components/layouts/AllyAdminLayout';
import StoreLayout from '../../components/layouts/StoreLayout';
import { Truck, Plus, Search, Trash2, UserPlus, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const AllyAdminDrivers = () => {
    const { profile } = useAuth();
    const isAllyAdmin = profile?.role === 'ally_admin';
    const Layout = isAllyAdmin ? AllyAdminLayout : StoreLayout;

    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchEmail, setSearchEmail] = useState('');
    const [searching, setSearching] = useState(false);
    const [foundDriver, setFoundDriver] = useState(null);
    const [storeId, setStoreId] = useState(null);

    useEffect(() => {
        if (profile?.id) {
            fetchStoreAndDrivers();
        }
    }, [profile?.id]);

    const fetchStoreAndDrivers = async () => {
        setLoading(true);
        try {
            // 1. Get Store ID
            const { data: store, error: storeError } = await supabase
                .from('stores')
                .select('id')
                .eq('owner_id', profile.id)
                .single();

            if (storeError) throw storeError;
            setStoreId(store.id);

            // 2. Fetch Trusted Drivers
            const { data, error } = await supabase
                .from('store_trusted_drivers')
                .select(`
                    driver_id,
                    delivery_drivers!inner (
                        id,
                        status,
                        profiles!inner (
                            full_name,
                            email,
                            phone
                        )
                    )
                `)
                .eq('store_id', store.id);

            if (error) throw error;
            setDrivers(data || []);
        } catch (error) {
            console.error('Error fetching trusted drivers:', error);
            toast.error('Error al cargar repartidores');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchEmail) return;

        setSearching(true);
        setFoundDriver(null);
        try {
            // Find user by email that IS a delivery_driver
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    full_name,
                    email,
                    delivery_drivers (
                        id,
                        status
                    )
                `)
                .eq('email', searchEmail.trim().toLowerCase())
                .eq('role', 'delivery_driver')
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    toast.error('No se encontró un repartidor con ese correo');
                } else {
                    throw error;
                }
            } else if (!data.delivery_drivers || data.delivery_drivers.length === 0) {
                toast.error('El usuario no está registrado como repartidor');
            } else {
                setFoundDriver(data);
            }
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Error en la búsqueda');
        } finally {
            setSearching(false);
        }
    };

    const addTrustedDriver = async (driverId) => {
        try {
            const { error } = await supabase
                .from('store_trusted_drivers')
                .insert([{ store_id: storeId, driver_id: driverId }]);

            if (error) {
                if (error.code === '23505') {
                    toast.error('Este repartidor ya está en tu lista');
                } else {
                    throw error;
                }
                return;
            }

            toast.success('Repartidor añadido con éxito');
            setShowAddModal(false);
            setFoundDriver(null);
            setSearchEmail('');
            fetchStoreAndDrivers();
        } catch (error) {
            console.error('Add error:', error);
            toast.error('Error al añadir repartidor');
        }
    };

    const removeTrustedDriver = async (driverId) => {
        if (!confirm('¿Seguro que deseas eliminar a este repartidor de tu lista de confianza?')) return;

        try {
            const { error } = await supabase
                .from('store_trusted_drivers')
                .delete()
                .eq('store_id', storeId)
                .eq('driver_id', driverId);

            if (error) throw error;
            toast.success('Repartidor eliminado');
            fetchStoreAndDrivers();
        } catch (error) {
            console.error('Remove error:', error);
            toast.error('Error al eliminar repartidor');
        }
    };

    return (
        <Layout>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mis Repartidores</h1>
                    <p className="text-gray-600">Gestiona tu flota de confianza</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-orange-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Añadir Repartidor
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-orange-600 animate-spin mb-4" />
                    <p className="text-gray-500">Cargando repartidores...</p>
                </div>
            ) : drivers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border-2 border-dashed border-gray-100">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
                        <Truck className="w-10 h-10 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Aún no tienes repartidores</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8">
                        Los repartidores que agregues aquí tendrán prioridad para recibir tus pedidos antes que el resto.
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="text-orange-600 font-bold hover:text-orange-700 flex items-center justify-center mx-auto"
                    >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Añadir mi primer repartidor
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {drivers.map((d) => {
                        const driverInfo = d.delivery_drivers;
                        const profileInfo = driverInfo.profiles;
                        return (
                            <div key={d.driver_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center">
                                            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                                <Truck className="h-6 w-6" />
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="font-bold text-gray-900">{profileInfo.full_name}</h3>
                                                <p className="text-xs text-gray-500">{profileInfo.email}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${driverInfo.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {driverInfo.status === 'available' ? 'Disponible' : 'Ocupado/Off'}
                                        </span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
                                        <span className="text-gray-500">{profileInfo.phone || 'Sin teléfono'}</span>
                                        <button
                                            onClick={() => removeTrustedDriver(d.driver_id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                            title="Eliminar de confianza"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Driver Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Añadir Repartidor</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                Ingresa el correo electrónico del repartidor registrado para añadirlo a tu flota de confianza.
                            </p>

                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="correo@ejemplo.com"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                                        value={searchEmail}
                                        onChange={(e) => setSearchEmail(e.target.value)}
                                    />
                                </div>
                                <button
                                    disabled={searching}
                                    type="submit"
                                    className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center transition-colors"
                                >
                                    {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Buscar Repartidor'}
                                </button>
                            </form>

                            {foundDriver && (
                                <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between animate-in slide-in-from-top duration-300">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold">
                                            {foundDriver.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="ml-3">
                                            <p className="font-bold text-sm text-gray-900">{foundDriver.full_name}</p>
                                            <p className="text-[10px] text-gray-500">{foundDriver.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => addTrustedDriver(foundDriver.id)}
                                        className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-700"
                                    >
                                        Añadir
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default AllyAdminDrivers;
