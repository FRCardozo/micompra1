import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import DriverLayout from '../../components/layouts/DriverLayout';
import { Button, Input } from '../../components/common';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    vehicle_type: '',
    license_plate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        vehicle_type: profile.vehicle_type || '',
        license_plate: profile.license_plate || '',
      });
    }
  }, [profile]);

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
        .update(formData)
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
    <DriverLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi perfil</h1>
          <p className="text-gray-500 text-lg">Administra tu información de repartidor</p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Información Personal</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50/80 border-gray-100"
                />
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
                  placeholder="Tu número de teléfono"
                  required
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Vehículo</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de vehículo
                </label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                >
                  <option value="">Selecciona un tipo</option>
                  <option value="motorcycle">🏍️ Motocicleta</option>
                  <option value="bicycle">🚴 Bicicleta</option>
                  <option value="car">🚗 Automóvil</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Placa del vehículo
                </label>
                <Input
                  type="text"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleChange}
                  placeholder="ABC-123"
                  required
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full mt-10 py-4 text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Guardar cambios
          </Button>
        </form>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Cuenta</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/driver/orders')}
              className="py-4 justify-center"
            >
              📦 Mis entregas
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/driver/earnings')}
              className="py-4 justify-center"
            >
              💰 Mis ganancias
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="py-4 justify-center text-red-600 hover:bg-red-50 border-red-100"
            >
              🚪 Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </DriverLayout>
  );
};

export default Profile;
