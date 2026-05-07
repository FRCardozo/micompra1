import { useState, useEffect } from 'react';
import { Plus, MapPin, Edit2, Trash2, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import ZoneModal from '../../components/ZoneModal';
import AdminLayout from '../../components/layouts/AdminLayout';

export default function Coverage() {
  const [zones, setZones] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from('coverage_zones')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error('Error fetching zones:', error);
      toast.error('Error al cargar las zonas de servicio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta zona operativa?')) return;
    
    try {
      const { error } = await supabase
        .from('coverage_zones')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      toast.success('Zona eliminada correctamente');
      fetchZones();
    } catch (error) {
      toast.error('Error al eliminar la zona');
    }
  };

  return (
    <AdminLayout>
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-600" />
            Zonas de Servicio
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona los municipios y localidades donde la plataforma está activa
          </p>
        </div>
        <button 
          onClick={() => { setEditingZone(null); setIsModalOpen(true); }} 
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> Nueva Zona
        </button>
      </div>

      {/* Grid de Zonas */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-gray-400">
          Cargando zonas operativas...
        </div>
      ) : zones.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">Aún no hay zonas creadas</h3>
          <p className="text-gray-500 mb-6">Comienza agregando tu primer municipio (Ej: Galeras)</p>
          <button 
            onClick={() => { setEditingZone(null); setIsModalOpen(true); }} 
            className="text-indigo-600 font-semibold hover:text-indigo-700"
          >
            + Crear mi primera zona
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {zones.map(zone => (
            <div key={zone.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${zone.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'}`}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{zone.name}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{zone.city}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-widest rounded-full ${zone.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {zone.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6 flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Costo Envío Base:</span>
                  <span className="font-bold text-gray-900">${zone.base_delivery_cost?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tiempo Estimado:</span>
                  <span className="font-bold text-gray-900">{zone.estimated_delivery_time_minutes} min</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => { setEditingZone(zone); setIsModalOpen(true); }} 
                  className="flex-1 flex justify-center items-center gap-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 py-2.5 rounded-xl transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(zone.id)} 
                  className="flex justify-center items-center p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                  title="Eliminar Zona"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Optimizado */}
      {isModalOpen && (
        <ZoneModal
          zone={editingZone}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
            fetchZones();
          }}
        />
      )}
    </div>
    </AdminLayout>
  );
}