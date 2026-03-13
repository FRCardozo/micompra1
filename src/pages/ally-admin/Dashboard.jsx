import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AllyAdminLayout from '../../components/layouts/AllyAdminLayout';
import { ShoppingBag, Truck, Map } from 'lucide-react';
import { Link } from 'react-router-dom';

const AllyAdminDashboard = () => {
    const { profile } = useAuth();

    return (
        <AllyAdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Panel General
                </h1>
                <p className="text-gray-600">
                    Bienvenido de nuevo, {profile?.full_name}
                </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 mb-8">
                {/* Card 1: Mandados */}
                <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                                <Truck className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Mandados Activos
                                    </dt>
                                    <dd className="text-2xl font-semibold text-gray-900">
                                        0
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                        <div className="text-sm">
                            <Link to="/ally-admin/orders" className="font-medium text-orange-600 hover:text-orange-900">
                                Ver todos los mandados &rarr;
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Card 2: Tienda */}
                <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                                <ShoppingBag className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Pedidos Tienda
                                    </dt>
                                    <dd className="text-2xl font-semibold text-gray-900">
                                        0
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                        <div className="text-sm">
                            <Link to="/ally-admin/store" className="font-medium text-blue-600 hover:text-blue-900">
                                Gestionar mi tienda &rarr;
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Card 3: Auto-Despacho */}
                <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow ring-2 ring-green-500">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                                <Map className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Modo Repartidor
                                    </dt>
                                    <dd className="text-lg font-bold text-green-600">
                                        Activo
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 px-5 py-3 border-t border-green-100">
                        <div className="text-sm">
                            <button className="font-medium text-green-700 hover:text-green-900">
                                Pausar Modo Reparto &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div className="flex">
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                            ¿Qué puedo hacer aquí?
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>
                                Este es tu panel de control híbrido. Aquí puedes:
                            </p>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                                <li>Gestionar los productos y pedidos de tu tienda.</li>
                                <li>Ver y asignar mandados a tus "Repartidores de Confianza".</li>
                                <li>Autodespacharte pedidos si así lo deseas.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AllyAdminLayout>
    );
};

export default AllyAdminDashboard;
