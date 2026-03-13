import React, { useEffect, useState } from 'react';
import { ShoppingBag, X, Clock, MapPin, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';

const ActiveMandadosModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [mandados, setMandados] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && user) {
            fetchActiveMandados();
        }
    }, [isOpen, user]);

    const fetchActiveMandados = async () => {
        try {
            setLoading(true);
            // This is a placeholder query - adjusting to potential schema
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          store:stores(name, logo_url)
        `)
                .eq('user_id', user.id)
                .in('status', ['pending', 'accepted', 'pickup', 'on_way'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMandados(data || []);
        } catch (error) {
            console.error('Error fetching active mandados:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Panel */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <ShoppingBag size={24} />
                            Mandados Activos
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                            </div>
                        ) : mandados.length > 0 ? (
                            <div className="space-y-4">
                                {mandados.map((mandado) => (
                                    <div
                                        key={mandado.id}
                                        className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                                    {mandado.store?.logo_url ? (
                                                        <img src={mandado.store.logo_url} alt={mandado.store.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xl">🏪</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{mandado.store?.name || 'Tienda'}</h3>
                                                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium capitalize">
                                                        {mandado.status === 'on_way' ? 'En camino' : mandado.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">
                                                ${mandado.total_amount?.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                            <Clock size={14} />
                                            <span>{new Date(mandado.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <MapPin size={14} />
                                            <span className="truncate">{mandado.delivery_address || 'Dirección de entrega'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShoppingBag size={32} className="text-gray-400" />
                                </div>
                                <p className="font-medium text-gray-900 mb-1">No tienes mandados activos</p>
                                <p className="text-sm mb-6">¡Haz tu primer pedido hoy!</p>
                                <Button
                                    onClick={onClose}
                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                    Explorar Tiendas
                                </Button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ActiveMandadosModal;
