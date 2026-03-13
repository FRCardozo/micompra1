import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/layouts/AdminLayout';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const StoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [owners, setOwners] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: 'Galeras',
    phone: '',
    email: '',
    description: '',
    category_id: '',
    owner_id: '',
    status: 'active',
    delivery_cost: '',
    minimum_order: '',
    estimated_delivery_time: '',
    delivery_radius_km: ''
  });

  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterStores();
  }, [stores, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStores(),
        fetchCategories(),
        fetchOwners()
      ]);
    } catch (error) {
      console.error('[StoreManagement] Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    console.log('[StoreManagement] Fetching stores');
    const { data, error } = await supabase
      .from('stores')
      .select(`
        *,
        owner:profiles!stores_owner_id_fkey(full_name, email),
        category:store_categories(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[StoreManagement] Error fetching stores:', error);
      throw error;
    }

    console.log('[StoreManagement] Stores fetched:', data?.length);
    setStores(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('store_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('[StoreManagement] Error fetching categories:', error);
      throw error;
    }

    setCategories(data || []);
  };

  const fetchOwners = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'store')
      .eq('is_active', true)
      .order('full_name');

    if (error) {
      console.error('[StoreManagement] Error fetching owners:', error);
      throw error;
    }

    setOwners(data || []);
  };

  const filterStores = () => {
    if (!searchTerm.trim()) {
      setFilteredStores(stores);
      return;
    }

    const filtered = stores.filter(store =>
      store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredStores(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: 'Galeras',
      phone: '',
      email: '',
      description: '',
      category_id: '',
      owner_id: '',
      status: 'active',
      delivery_cost: '',
      minimum_order: '',
      estimated_delivery_time: '',
      delivery_radius_km: ''
    });
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    console.log('[StoreManagement] Creating store:', formData);

    try {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-');

      const { data, error } = await supabase
        .from('stores')
        .insert([{
          ...formData,
          slug,
          delivery_cost: parseFloat(formData.delivery_cost) || 0,
          minimum_order: parseFloat(formData.minimum_order) || 0,
          estimated_delivery_time: parseInt(formData.estimated_delivery_time) || 30,
          delivery_radius_km: parseFloat(formData.delivery_radius_km) || 5
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('[StoreManagement] Store created successfully:', data);
      toast.success('Tienda creada exitosamente');
      setShowCreateModal(false);
      resetForm();
      await fetchStores();
    } catch (error) {
      console.error('[StoreManagement] Error creating store:', error);
      toast.error('Error al crear tienda: ' + error.message);
    }
  };

  const handleEditStore = async (e) => {
    e.preventDefault();
    console.log('[StoreManagement] Updating store:', selectedStore.id, formData);

    try {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-');

      const { data, error } = await supabase
        .from('stores')
        .update({
          ...formData,
          slug,
          delivery_cost: parseFloat(formData.delivery_cost) || 0,
          minimum_order: parseFloat(formData.minimum_order) || 0,
          estimated_delivery_time: parseInt(formData.estimated_delivery_time) || 30,
          delivery_radius_km: parseFloat(formData.delivery_radius_km) || 5,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStore.id)
        .select()
        .single();

      if (error) throw error;

      console.log('[StoreManagement] Store updated successfully:', data);
      toast.success('Tienda actualizada exitosamente');
      setShowEditModal(false);
      setSelectedStore(null);
      resetForm();
      await fetchStores();
    } catch (error) {
      console.error('[StoreManagement] Error updating store:', error);
      toast.error('Error al actualizar tienda: ' + error.message);
    }
  };

  const handleDeleteStore = async () => {
    if (deleteConfirmText !== 'ELIMINAR') {
      toast.error('Debes escribir "ELIMINAR" para confirmar');
      return;
    }

    console.log('[StoreManagement] Deleting store:', selectedStore.id);

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', selectedStore.id);

      if (error) throw error;

      console.log('[StoreManagement] Store deleted successfully');
      toast.success('Tienda eliminada exitosamente');
      setShowDeleteModal(false);
      setSelectedStore(null);
      setDeleteConfirmText('');
      await fetchStores();
    } catch (error) {
      console.error('[StoreManagement] Error deleting store:', error);
      toast.error('Error al eliminar tienda: ' + error.message);
    }
  };

  const openEditModal = (store) => {
    console.log('[StoreManagement] Opening edit modal for store:', store.id);
    setSelectedStore(store);
    setFormData({
      name: store.name || '',
      address: store.address || '',
      city: store.city || 'Galeras',
      phone: store.phone || '',
      email: store.email || '',
      description: store.description || '',
      category_id: store.category_id || '',
      owner_id: store.owner_id || '',
      status: store.status || 'active',
      delivery_cost: store.delivery_cost?.toString() || '',
      minimum_order: store.minimum_order?.toString() || '',
      estimated_delivery_time: store.estimated_delivery_time?.toString() || '',
      delivery_radius_km: store.delivery_radius_km?.toString() || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (store) => {
    console.log('[StoreManagement] Opening delete modal for store:', store.id);
    setSelectedStore(store);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    active: 'Activa',
    inactive: 'Inactiva',
    pending_approval: 'Pendiente',
    suspended: 'Suspendida'
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Tiendas</h1>
            <p className="text-gray-600">Crea, edita y elimina tiendas del sistema</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nueva Tienda
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, dueño o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Mostrando {filteredStores.length} de {stores.length} tiendas
          </div>
        </div>

        {/* Stores Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tienda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Dueño
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{store.name}</div>
                        <div className="text-sm text-gray-500">{store.address}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{store.owner?.full_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{store.owner?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {store.category?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[store.status]}`}>
                        {statusLabels[store.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditModal(store)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(store)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" onClick={() => setShowCreateModal(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <form onSubmit={handleCreateStore}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Nueva Tienda
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dueño *
                          </label>
                          <select
                            value={formData.owner_id}
                            onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          >
                            <option value="">Seleccionar dueño</option>
                            {owners.map((owner) => (
                              <option key={owner.id} value={owner.id}>
                                {owner.full_name} ({owner.email})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dirección *
                        </label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría *
                          </label>
                          <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          >
                            <option value="">Seleccionar categoría</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado *
                          </label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          >
                            <option value="active">Activa</option>
                            <option value="inactive">Inactiva</option>
                            <option value="pending_approval">Pendiente</option>
                            <option value="suspended">Suspendida</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Costo de envío (COP)
                          </label>
                          <input
                            type="number"
                            value={formData.delivery_cost}
                            onChange={(e) => setFormData({ ...formData, delivery_cost: e.target.value })}
                            min="0"
                            step="100"
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pedido mínimo (COP)
                          </label>
                          <input
                            type="number"
                            value={formData.minimum_order}
                            onChange={(e) => setFormData({ ...formData, minimum_order: e.target.value })}
                            min="0"
                            step="100"
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tiempo de entrega (min)
                          </label>
                          <input
                            type="number"
                            value={formData.estimated_delivery_time}
                            onChange={(e) => setFormData({ ...formData, estimated_delivery_time: e.target.value })}
                            min="0"
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Radio de entrega (km)
                          </label>
                          <input
                            type="number"
                            value={formData.delivery_radius_km}
                            onChange={(e) => setFormData({ ...formData, delivery_radius_km: e.target.value })}
                            min="0"
                            step="0.1"
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      Crear Tienda
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedStore && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" onClick={() => setShowEditModal(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <form onSubmit={handleEditStore}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Editar Tienda
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dueño *
                          </label>
                          <select
                            value={formData.owner_id}
                            onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          >
                            <option value="">Seleccionar dueño</option>
                            {owners.map((owner) => (
                              <option key={owner.id} value={owner.id}>
                                {owner.full_name} ({owner.email})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dirección *
                        </label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría *
                          </label>
                          <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          >
                            <option value="">Seleccionar categoría</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado *
                          </label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          >
                            <option value="active">Activa</option>
                            <option value="inactive">Inactiva</option>
                            <option value="pending_approval">Pendiente</option>
                            <option value="suspended">Suspendida</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Costo de envío (COP)
                          </label>
                          <input
                            type="number"
                            value={formData.delivery_cost}
                            onChange={(e) => setFormData({ ...formData, delivery_cost: e.target.value })}
                            min="0"
                            step="100"
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pedido mínimo (COP)
                          </label>
                          <input
                            type="number"
                            value={formData.minimum_order}
                            onChange={(e) => setFormData({ ...formData, minimum_order: e.target.value })}
                            min="0"
                            step="100"
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tiempo de entrega (min)
                          </label>
                          <input
                            type="number"
                            value={formData.estimated_delivery_time}
                            onChange={(e) => setFormData({ ...formData, estimated_delivery_time: e.target.value })}
                            min="0"
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Radio de entrega (km)
                          </label>
                          <input
                            type="number"
                            value={formData.delivery_radius_km}
                            onChange={(e) => setFormData({ ...formData, delivery_radius_km: e.target.value })}
                            min="0"
                            step="0.1"
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      Guardar Cambios
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedStore && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" onClick={() => setShowDeleteModal(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                        Eliminar Tienda
                      </h3>
                      <div className="mt-2 space-y-3">
                        <p className="text-sm text-gray-500">
                          Estás a punto de eliminar la tienda <strong>{selectedStore.name}</strong>.
                        </p>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                          <p className="text-sm text-yellow-700">
                            <strong>⚠️ Advertencia:</strong> Esta acción es irreversible y eliminará:
                          </p>
                          <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
                            <li>Todos los productos de la tienda</li>
                            <li>Historial de pedidos relacionados</li>
                            <li>Todas las configuraciones asociadas</li>
                          </ul>
                        </div>
                        <p className="text-sm text-gray-600 mt-3">
                          Para confirmar, escribe <strong>ELIMINAR</strong> en el campo:
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Escribe ELIMINAR"
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteStore}
                    disabled={deleteConfirmText !== 'ELIMINAR'}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    Eliminar Tienda
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmText('');
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default StoreManagement;
