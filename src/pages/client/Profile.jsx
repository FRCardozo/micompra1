import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ClientLayout from '../../components/layouts/ClientLayout';
import { Button, Input } from '../../components/common';
import AddressModal from '../../components/common/AddressModal';
import toast from 'react-hot-toast';

const DEFAULT_COORDS = { latitude: 8.9167, longitude: -75.1833 };

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addrLoading, setAddrLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      });
      fetchAddresses();
    }
  }, [profile]);

  const fetchAddresses = async () => {
    try {
      setAddrLoading(true);
      const { data, error } = await supabase
        .from('client_addresses')
        .select('*')
        .eq('client_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setAddrLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (data, addressId) => {
    setAddrLoading(true);

    try {
      const payload = {
        address_name: data.address_name,
        address_line: data.address_line,
        instructions: data.instructions,
        is_default: data.is_default || addresses.length === 0,
        latitude: data.latitude ?? DEFAULT_COORDS.latitude,
        longitude: data.longitude ?? DEFAULT_COORDS.longitude,
        client_id: user.id,
      };

      if (payload.is_default) {
        await supabase
          .from('client_addresses')
          .update({ is_default: false })
          .eq('client_id', user.id);
      }

      let error;
      if (addressId) {
        ({ error } = await supabase
          .from('client_addresses')
          .update(payload)
          .eq('id', addressId));
      } else {
        ({ error } = await supabase
          .from('client_addresses')
          .insert([payload]));
      }

      if (error) throw error;

      toast.success(addressId ? 'Dirección actualizada' : 'Dirección agregada');
      setShowAddressModal(false);
      setEditingAddress(null);
      await fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Error al guardar la dirección');
    } finally {
      setAddrLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta dirección?')) return;

    try {
      const { error } = await supabase
        .from('client_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Dirección eliminada');
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Error al eliminar');
    }
  };

  const setAsDefault = async (address) => {
    try {
      setAddrLoading(true);
      await supabase
        .from('client_addresses')
        .update({ is_default: false })
        .eq('client_id', user.id);

      const { error } = await supabase
        .from('client_addresses')
        .update({ is_default: true })
        .eq('id', address.id);

      if (error) throw error;
      toast.success('Dirección predeterminada actualizada');
      fetchAddresses();
    } catch (error) {
      console.error('Error setting default:', error);
    } finally {
      setAddrLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
          <div className="relative z-10 flex items-center space-x-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl">
              <span className="text-4xl font-bold text-white">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {profile?.full_name || 'Usuario'}
              </h1>
              <p className="text-white/90 text-lg">{user?.email}</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Información personal</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-50/80 border-gray-200/50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-lg font-medium">
                        Verificado
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tu correo electrónico no puede ser modificado
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre completo
                  </label>
                  <Input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Tu nombre completo"
                    required
                    className="border-gray-200/50 focus:ring-orange-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+57 300 123 4567"
                    required
                    className="border-gray-200/50 focus:ring-orange-500/50"
                  />
                </div>

              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full mt-8 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Guardar cambios
              </Button>
            </form>

            {/* Address Management Section */}
            <div className="mt-8 bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Mis direcciones</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingAddress(null);
                    setShowAddressModal(true);
                  }}
                >
                  + Nueva
                </Button>
              </div>

              {addrLoading && addresses.length === 0 ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`p-4 rounded-2xl border-2 transition-all ${addr.is_default ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-900">{addr.address_name}</span>
                            {addr.is_default && (
                              <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter font-bold">
                                Predeterminada
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{addr.address_line}</p>
                          {addr.instructions && <p className="text-xs text-gray-500 italic">"{addr.instructions}"</p>}
                        </div>
                        <div className="flex space-x-1">
                          {!addr.is_default && (
                            <button
                              onClick={() => setAsDefault(addr)}
                              className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                              title="Marcar como predeterminada"
                            >
                              ★
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingAddress(addr);
                              setShowAddressModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <span className="text-4xl mb-2 block">📍</span>
                  <p className="text-gray-500 text-sm">No tienes direcciones guardadas aún.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 border border-blue-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tus estadísticas</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total pedidos</span>
                  <span className="text-xl font-bold text-gray-900">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Favoritos</span>
                  <span className="text-xl font-bold text-gray-900">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cupones</span>
                  <span className="text-xl font-bold text-gray-900">3</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones rápidas</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/client/orders')}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <span className="text-lg">📦</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Mis pedidos</p>
                    <p className="text-xs text-gray-500">Ver historial</p>
                  </div>
                </button>

                <button
                  onClick={() => toast.success('Aquí verás tus negocios y productos favoritos pronto.')}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                    <span className="text-lg">❤️</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Favoritos</p>
                    <p className="text-xs text-gray-500">8 guardados</p>
                  </div>
                </button>

                <button
                  onClick={() => toast.success('Los cupones activos se mostrarán aquí cuando estén disponibles.')}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                    <span className="text-lg">🎟️</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Cupones</p>
                    <p className="text-xs text-gray-500">3 disponibles</p>
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-3 p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors group border border-red-200/50"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <span className="text-lg">🚪</span>
              </div>
              <span className="font-semibold text-red-600">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>

      <AddressModal
        isOpen={showAddressModal}
        onClose={() => {
          setShowAddressModal(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        editingAddress={editingAddress}
      />
    </ClientLayout>
  );
};

export default Profile;