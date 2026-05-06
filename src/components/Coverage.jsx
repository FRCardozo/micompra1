import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Power, PowerOff, Search, Settings, TrendingUp, Users, Store, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import ZoneModal from './ZoneModal';
import ZoneStatsModal from './ZoneStatsModal';

export default function Coverage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    console.log('[Coverage] Loading zones');
    try {
      const { data, error } = await supabase
        .from('coverage_zones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('[Coverage] Zones loaded:', data?.length || 0);
      setZones(data || []);
    } catch (error) {
      console.error('[Coverage] Error loading zones:', error);
      toast.error('Error al cargar zonas de cobertura');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = () => {
    console.log('[Coverage] Opening create zone modal');
    setSelectedZone(null);
    setIsModalOpen(true);
  };

  const handleEditZone = (zone) => {
    console.log('[Coverage] Opening edit zone modal:', zone.id);
    setSelectedZone(zone);
    setIsModalOpen(true);
  };

  const handleViewStats = (zone) => {
    console.log('[Coverage] Opening stats modal for zone:', zone.id);
    setSelectedZone(zone);
    setIsStatsModalOpen(true);
  };

  const handleToggleZone = async (zone) => {
    console.log('[Coverage] Toggling zone:', zone.id, 'active:', !zone.is_active);

    try {
      const { error } = await supabase
        .from('coverage_zones')
        .update({
          is_active: !zone.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', zone.id);

      if (error) throw error;

      toast.success(zone.is_active ? 'Zona desactivada' : 'Zona activada');
      loadZones();
    } catch (error) {
      console.error('[Coverage] Error toggling zone:', error);
      toast.error('Error al cambiar estado de zona');
    }
  };

  const handleDeleteZone = async (zone) => {
    if (!confirm(`¿Eliminar la zona "${zone.name}"?`)) return;

    console.log('[Coverage] Deleting zone:', zone.id);

    try {
      const { error } = await supabase
        .from('coverage_zones')
        .delete()
        .eq('id', zone.id);

      if (error) throw error;

      toast.success('Zona eliminada correctamente');
      loadZones();
    } catch (error) {
      console.error('[Coverage] Error deleting zone:', error);
      toast.error('Error al eliminar zona');
    }
  };

  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cobertura del Servicio</h1>
          <p className="text-gray-600 mt-1">
            Define y gestiona las zonas donde la app está disponible
          </p>
        </div>
        <button
          onClick={handleCreateZone}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Zona
        </button>
      </div>

      {/* Mapa principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-[500px]">
          <CoverageMap
            zones={zones}
            onZoneClick={handleEditZone}
          />
        </div>
      </div>

      {/* Buscador y filtros */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de zonas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredZones.map((zone) => (
          <div
            key={zone.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${zone.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <MapPin className={`w-5 h-5 ${zone.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                  <p className="text-sm text-gray-600">{zone.city}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                zone.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {zone.is_active ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Costo base:</span>
                <span className="font-medium text-gray-900">
                  ${zone.base_delivery_cost?.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tiempo estimado:</span>
                <span className="font-medium text-gray-900">
                  {zone.estimated_delivery_time_minutes} min
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Prioridad:</span>
                <span className="font-medium text-gray-900">
                  {zone.priority}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleViewStats(zone)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm"
              >
                <TrendingUp className="w-4 h-4" />
                Stats
              </button>
              <button
                onClick={() => handleEditZone(zone)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => handleToggleZone(zone)}
                className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                  zone.is_active
                    ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                {zone.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleDeleteZone(zone)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredZones.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'No se encontraron zonas' : 'No hay zonas de cobertura creadas'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreateZone}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Crear primera zona
            </button>
          )}
        </div>
      )}

      {/* Modales */}
      {isModalOpen && (
        <ZoneModal
          zone={selectedZone}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedZone(null);
          }}
          onSave={() => {
            setIsModalOpen(false);
            setSelectedZone(null);
            loadZones();
          }}
        />
      )}

      {isStatsModalOpen && selectedZone && (
        <ZoneStatsModal
          zone={selectedZone}
          onClose={() => {
            setIsStatsModalOpen(false);
            setSelectedZone(null);
          }}
        />
      )}
    </div>
  );
}
