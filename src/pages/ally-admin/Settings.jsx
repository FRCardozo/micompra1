import AllyAdminLayout from '../../components/layouts/AllyAdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { User, Store, Bell, Lock } from 'lucide-react';

const AllyAdminSettings = () => {
    const { profile } = useAuth();

    return (
        <AllyAdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
                <p className="text-gray-600">Administra tu cuenta y preferencias</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-200">
                {/* Profile Section */}
                <div className="p-4 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2 text-orange-600" />
                        Perfil Personal
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                            <input disabled type="text" value={profile?.full_name || ''} className="mt-1 block w-full bg-gray-50 border-gray-300 rounded-lg shadow-sm opacity-70 cursor-not-allowed px-4 py-2 text-sm sm:text-base" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                            <input disabled type="text" value={profile?.email || ''} className="mt-1 block w-full bg-gray-50 border-gray-300 rounded-lg shadow-sm opacity-70 cursor-not-allowed px-4 py-2 text-sm sm:text-base" />
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="p-4 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Bell className="w-5 h-5 mr-2 text-orange-600" />
                        Notificaciones
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-700 text-sm sm:text-base">Nuevos Pedidos</span>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-700 text-sm sm:text-base">Actualización de Estados</span>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 bg-gray-50 rounded-b-xl">
                    <button className="w-full sm:w-auto text-orange-600 font-bold hover:text-orange-700 flex items-center justify-center sm:justify-start transition-colors py-2">
                        <Lock className="w-4 h-4 mr-2" />
                        Cambiar Contraseña
                    </button>
                </div>
            </div>
        </AllyAdminLayout>
    );
};

export default AllyAdminSettings;
