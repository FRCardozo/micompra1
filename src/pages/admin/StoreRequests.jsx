import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Store, MapPin, Phone, CheckCircle, XCircle, Clock, Search, AlertCircle } from 'lucide-react';
// IMPORTACIÓN CLAVE: El Layout del Administrador
import AdminLayout from '../../components/layouts/AdminLayout';

export default function StoreRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Buscamos solo las tiendas que están esperando aprobación
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching store requests:', error);
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (storeId, newStatus, storeName) => {
    try {
      setProcessingId(storeId);
      
      const { error } = await supabase
        .from('stores')
        .update({ status: newStatus })
        .eq('id', storeId);

      if (error) throw error;

      toast.success(
        newStatus === 'active' 
          ? `¡Tienda "${storeName}" Aprobada!` 
          : `Solicitud de "${storeName}" rechazada.`
      );
      
      // Recargamos la lista para que desaparezca la tarjeta
      fetchRequests();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast.error('Hubo un error al procesar la solicitud');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* HEADER DE LA SECCIÓN */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Store className="w-8 h-8 text-indigo-600" />
              Solicitudes Pendientes
            </h1>
            <p className="text-gray-500 mt-1">Revisa y aprueba los nuevos comercios que quieren unirse a MiCompra.</p>
          </div>
          <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm border border-orange-100">
            <Clock className="w-5 h-5" />
            {requests.length} en espera
          </div>
        </div>

        {/* LISTA DE SOLICITUDES */}
        {requests.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-gray-100 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¡Todo al día!</h2>
            <p className="text-gray-500">No hay solicitudes de tiendas pendientes de aprobación en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requests.map((store) => (
              <div key={store.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 mb-1">{store.name}</h3>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 px-2.5 py-1 rounded-lg uppercase">
                        <Clock className="w-3 h-3" /> En Revisión
                      </span>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">Dirección</p>
                        <p className="text-sm text-gray-600">{store.address}</p>
                        {store.lat && store.lng && (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:underline font-semibold mt-1 inline-block"
                          >
                            Ver coordenadas en mapa
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">WhatsApp</p>
                        <p className="text-sm text-gray-600">{store.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="border-t border-gray-100 bg-gray-50/50 p-4 flex gap-3">
                  <button
                    onClick={() => handleAction(store.id, 'rejected', store.name)}
                    disabled={processingId === store.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" /> Rechazar
                  </button>
                  <button
                    onClick={() => handleAction(store.id, 'active', store.name)}
                    disabled={processingId === store.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" /> Aprobar Tienda
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}